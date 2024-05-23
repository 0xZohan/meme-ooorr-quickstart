import { Col, Flex, Row, Skeleton, Tag, Typography } from 'antd';
import styled from 'styled-components';

import { balanceFormat } from '@/common-util';
import { COLOR } from '@/constants';
import { useBalance } from '@/hooks';
import { useReward } from '@/hooks/useReward';

const { Text } = Typography;

const RewardsRow = styled(Row)`
  margin: 0 -24px;
  > .ant-col {
    padding: 24px;
    border-right: 1px solid ${COLOR.BORDER_GRAY};
  }
`;

const DisplayRewards = () => {
  const { availableRewardsForEpochEth, isEligibleForRewards } = useReward();
  const { isBalanceLoaded, totalOlasStakedBalance } = useBalance();

  // 20 OLAS is the minimum amount to stake
  const isStaked = totalOlasStakedBalance === 20;

  return (
    <RewardsRow>
      <Col span={12}>
        <Flex vertical gap={4} align="flex-start">
          <Text>Staking rewards today</Text>
          {isBalanceLoaded ? (
            <>
              <Text strong style={{ fontSize: 20 }}>
                {balanceFormat(availableRewardsForEpochEth, 2)} OLAS
              </Text>
              {isEligibleForRewards ? (
                <Tag color="success">Earned</Tag>
              ) : (
                <Tag color="processing">Not yet earned</Tag>
              )}
            </>
          ) : (
            <Flex vertical gap={8}>
              <Skeleton.Button active size="small" style={{ width: 92 }} />
              <Skeleton.Button active size="small" style={{ width: 92 }} />
            </Flex>
          )}
        </Flex>
      </Col>

      <Col span={12}>
        <Flex vertical gap={4} align="flex-start">
          <Text>Staked amount</Text>
          {isBalanceLoaded ? (
            <>
              <Text strong style={{ fontSize: 20 }}>
                {balanceFormat(totalOlasStakedBalance, 2)} OLAS
              </Text>
              {isStaked ? null : <Tag color="processing">Not yet staked</Tag>}
            </>
          ) : (
            <Flex vertical gap={8}>
              <Skeleton.Button active size="small" style={{ width: 92 }} />
              <Skeleton.Button active size="small" style={{ width: 92 }} />
            </Flex>
          )}
        </Flex>
      </Col>
    </RewardsRow>
  );
};

export const MainRewards = () => (
  <>
    <DisplayRewards />
  </>
);
