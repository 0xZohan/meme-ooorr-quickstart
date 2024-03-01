import { useServices, useSpawn, useTabs } from '@/hooks';
import { Button, Flex, message } from 'antd';
import { useRouter } from 'next/router';

export const SpawnDone = () => {
  const router = useRouter();

  const { resetSpawn } = useSpawn();
  const { resetTabs } = useTabs();
  const { updateServicesState } = useServices();

  const handleViewAgent = () =>
    router.push('/').then(() => {
      resetTabs();
      resetSpawn();
      updateServicesState().catch(() =>
        message.error('Failed to update services'),
      );
    });

  return (
    <Flex justify="center">
      <Button type="primary" onClick={handleViewAgent}>
        View agent
      </Button>
    </Flex>
  );
};
