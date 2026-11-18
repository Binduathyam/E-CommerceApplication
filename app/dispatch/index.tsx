import { useRouter } from 'expo-router';
import React, { useCallback } from 'react';

import { DispatchDashboard } from './DispatchPortal';

export default function DispatchHomeScreen() {
  const router = useRouter();

  const handleLogout = useCallback(() => {
    router.replace('/dispatch/login' as any);
  }, [router]);

  return <DispatchDashboard onLogout={handleLogout} />;
}