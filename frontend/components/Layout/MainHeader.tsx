import {
  MinusOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Badge, Button } from 'antd';
import Image from 'next/image';
import { useCallback, useMemo, useState } from 'react';

import { DeploymentStatus } from '@/client';
import { PageState } from '@/enums';
import { usePageState, useServiceTemplates, useWallet } from '@/hooks';
import { useServices } from '@/hooks/useServices';
import { ServicesService } from '@/service';

import { Header } from './Header';

export const MainHeader = () => {
  const { setPageState } = usePageState();
  const { services, serviceStatus, setServiceStatus } = useServices();
  const { getServiceTemplates } = useServiceTemplates();
  const { balance } = useWallet();

  const [serviceButtonState, setServiceButtonState] = useState({
    isLoading: false,
  });

  const serviceTemplate = useMemo(
    () => getServiceTemplates()[0],
    [getServiceTemplates],
  );

  const agentHead = useMemo(() => {
    if (serviceStatus === DeploymentStatus.DEPLOYED)
      return (
        <Badge status="processing" color="green" dot offset={[-5, 32.5]}>
          <Image
            src="/happy-robot.svg"
            alt="Happy Robot"
            width={35}
            height={35}
          />
        </Badge>
      );
    return (
      <Badge dot offset={[-5, 32.5]}>
        <Image src="/sad-robot.svg" alt="Sad Robot" width={35} height={35} />
      </Badge>
    );
  }, [serviceStatus]);

  const handleStart = useCallback(() => {
    setServiceButtonState({ ...serviceButtonState, isLoading: true });
    if (services.length > 0) {
      return ServicesService.startDeployment(services[0].hash).then(() => {
        setServiceStatus(DeploymentStatus.DEPLOYED);
        setServiceButtonState({ ...serviceButtonState, isLoading: false });
      });
    }
    return ServicesService.createService({
      serviceTemplate,
      deploy: true,
    }).then(() => {
      setServiceStatus(DeploymentStatus.DEPLOYED);
      setServiceButtonState({ ...serviceButtonState, isLoading: false });
    });
  }, [serviceButtonState, serviceTemplate, services, setServiceStatus]);

  const handleStop = useCallback(() => {
    if (services.length === 0) return;
    setServiceButtonState((prev) => ({ ...prev, isLoading: true }));
    ServicesService.stopDeployment(services[0].hash).then(() => {
      setServiceStatus(DeploymentStatus.STOPPED);
      setServiceButtonState((prev) => ({ ...prev, isLoading: false }));
    });
  }, [services, setServiceStatus]);

  const serviceToggleButton = useMemo(() => {
    if (serviceButtonState.isLoading)
      return (
        <Button type="text" loading>
          Loading
        </Button>
      );
    if (serviceStatus === DeploymentStatus.DEPLOYED)
      return (
        <Button
          type="text"
          icon={<PauseCircleOutlined color="red" />}
          onClick={handleStop}
        >
          Pause
        </Button>
      );
    if (balance === undefined) {
      return (
        <Button type="text" disabled>
          RPC Error
        </Button>
      );
    }
    if (balance < 1)
      return (
        <Button type="text" disabled>
          Not funded
        </Button>
      );
    return (
      <Button type="text" icon={<PlayCircleOutlined />} onClick={handleStart}>
        Start
      </Button>
    );
  }, [
    balance,
    handleStart,
    handleStop,
    serviceButtonState.isLoading,
    serviceStatus,
  ]);
  return (
    <Header>
      {agentHead}

      {serviceToggleButton}

      <Button
        type="text"
        style={{ marginLeft: 'auto' }}
        onClick={() => setPageState(PageState.Settings)}
      >
        <SettingOutlined />
      </Button>
      <Button type="text" disabled>
        <MinusOutlined />
      </Button>
    </Header>
  );
};
