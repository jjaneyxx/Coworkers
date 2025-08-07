'use client';

import loginWithOauth from '@/app/(auth)/oauth/kakao/loginWIthOauth';
import { useEffect } from 'react';

export interface CookieSetterProps {
  code: string;
  state: string;
}

export default function CookieSetter({ code, state }: CookieSetterProps) {
  useEffect(() => {
    (async () => {
      await loginWithOauth({ code, state });
    })();
  }, [code, state]);

  return <div></div>;
}
