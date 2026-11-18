import { useRouter } from 'expo-router';
import React from 'react';

import { DispatchLogin } from './DispatchPortal';

export default function DispatchLoginScreen() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/login' as any);
    }
  };

  const handleLoginSuccess = () => {
    // After login, open the Dispatch Portal (app/dispatch/index.tsx)
    router.replace('/dispatch' as any);
  };

  const handleRegister = () => {
    router.push('/dispatch/DispatchRegister' as any);
  };

  return (
    <DispatchLogin
      onBack={handleBack}
      onLoginSuccess={handleLoginSuccess}
      onRegister={handleRegister}
    />
  );
}