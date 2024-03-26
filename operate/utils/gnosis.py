# -*- coding: utf-8 -*-
# ------------------------------------------------------------------------------
#
#   Copyright 2023 Valory AG
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.
#
# ------------------------------------------------------------------------------

"""Safe helpers."""

import secrets
import typing as t
from enum import Enum

from aea.crypto.base import Crypto, LedgerApi
from autonomy.chain.base import registry_contracts
from autonomy.chain.config import ChainType as ChainProfile
from autonomy.chain.tx import TxSettler


NULL_ADDRESS: str = "0x" + "0" * 40
MAX_UINT256 = 2**256 - 1
ZERO_ETH = 0


class SafeOperation(Enum):
    """Operation types."""

    CALL = 0
    DELEGATE_CALL = 1
    CREATE = 2


class MultiSendOperation(Enum):
    """Operation types."""

    CALL = 0
    DELEGATE_CALL = 1


def hash_payload_to_hex(  # pylint: disable=too-many-arguments,too-many-locals
    safe_tx_hash: str,
    ether_value: int,
    safe_tx_gas: int,
    to_address: str,
    data: bytes,
    operation: int = SafeOperation.CALL.value,
    base_gas: int = 0,
    safe_gas_price: int = 0,
    gas_token: str = NULL_ADDRESS,
    refund_receiver: str = NULL_ADDRESS,
    use_flashbots: bool = False,
    gas_limit: int = 0,
    raise_on_failed_simulation: bool = False,
) -> str:
    """Serialise to a hex string."""
    if len(safe_tx_hash) != 64:  # should be exactly 32 bytes!
        raise ValueError(
            "cannot encode safe_tx_hash of non-32 bytes"
        )  # pragma: nocover

    if len(to_address) != 42 or len(gas_token) != 42 or len(refund_receiver) != 42:
        raise ValueError("cannot encode address of non 42 length")  # pragma: nocover

    if (
        ether_value > MAX_UINT256
        or safe_tx_gas > MAX_UINT256
        or base_gas > MAX_UINT256
        or safe_gas_price > MAX_UINT256
        or gas_limit > MAX_UINT256
    ):
        raise ValueError(
            "Value is bigger than the max 256 bit value"
        )  # pragma: nocover

    if operation not in [v.value for v in SafeOperation]:
        raise ValueError("SafeOperation value is not valid")  # pragma: nocover

    if not isinstance(use_flashbots, bool):
        raise ValueError(
            f"`use_flashbots` value ({use_flashbots}) is not valid. A boolean value was expected instead"
        )

    ether_value_ = ether_value.to_bytes(32, "big").hex()
    safe_tx_gas_ = safe_tx_gas.to_bytes(32, "big").hex()
    operation_ = operation.to_bytes(1, "big").hex()
    base_gas_ = base_gas.to_bytes(32, "big").hex()
    safe_gas_price_ = safe_gas_price.to_bytes(32, "big").hex()
    use_flashbots_ = use_flashbots.to_bytes(32, "big").hex()
    gas_limit_ = gas_limit.to_bytes(32, "big").hex()
    raise_on_failed_simulation_ = raise_on_failed_simulation.to_bytes(32, "big").hex()

    concatenated = (
        safe_tx_hash
        + ether_value_
        + safe_tx_gas_
        + to_address
        + operation_
        + base_gas_
        + safe_gas_price_
        + gas_token
        + refund_receiver
        + use_flashbots_
        + gas_limit_
        + raise_on_failed_simulation_
        + data.hex()
    )
    return concatenated


def skill_input_hex_to_payload(payload: str) -> dict:
    """Decode payload."""
    tx_params = dict(
        safe_tx_hash=payload[:64],
        ether_value=int.from_bytes(bytes.fromhex(payload[64:128]), "big"),
        safe_tx_gas=int.from_bytes(bytes.fromhex(payload[128:192]), "big"),
        to_address=payload[192:234],
        operation=int.from_bytes(bytes.fromhex(payload[234:236]), "big"),
        base_gas=int.from_bytes(bytes.fromhex(payload[236:300]), "big"),
        safe_gas_price=int.from_bytes(bytes.fromhex(payload[300:364]), "big"),
        gas_token=payload[364:406],
        refund_receiver=payload[406:448],
        use_flashbots=bool.from_bytes(bytes.fromhex(payload[448:512]), "big"),
        gas_limit=int.from_bytes(bytes.fromhex(payload[512:576]), "big"),
        raise_on_failed_simulation=bool.from_bytes(
            bytes.fromhex(payload[576:640]), "big"
        ),
        data=bytes.fromhex(payload[640:]),
    )
    return tx_params


def _get_nonce() -> int:
    """Generate a nonce for the Safe deployment."""
    return secrets.SystemRandom().randint(0, 2**256 - 1)


def create_safe(
    ledger_api: LedgerApi,
    crypto: Crypto,
    owner: t.Optional[str] = None,
    salt_nonce: t.Optional[int] = None,
) -> t.Tuple[str, int]:
    """Create gnosis safe."""
    salt_nonce = salt_nonce or _get_nonce()
    tx = registry_contracts.gnosis_safe.get_deploy_transaction(
        ledger_api=ledger_api,
        deployer_address=crypto.address,
        owners=[crypto.address],
        threshold=1,
        salt_nonce=salt_nonce,
    )
    safe = tx.pop("contract_address")

    def _build(  # pylint: disable=unused-argument
        *args: t.Any, **kwargs: t.Any
    ) -> t.Dict:
        tx = registry_contracts.gnosis_safe.get_deploy_transaction(
            ledger_api=ledger_api,
            deployer_address=crypto.address,
            owners=[crypto.address] if owner is None else [crypto.address, owner],
            threshold=1,
            salt_nonce=salt_nonce,
        )
        del tx["contract_address"]
        return tx

    tx_settler = TxSettler(
        ledger_api=ledger_api,
        crypto=crypto,
        chain_type=ChainProfile.CUSTOM,
    )
    setattr(  # noqa: B010
        tx_settler,
        "build",
        _build,
    )
    tx_settler.transact(
        method=lambda: {},
        contract="",
        kwargs={},
    )

    return safe, salt_nonce
