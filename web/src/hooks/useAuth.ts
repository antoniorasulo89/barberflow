import { useState, useCallback } from 'react';
import { authApi } from '../api';

function parseJwt(token: string) {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function useAuth() {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );

  const login = useCallback(async (slug: string, email: string, password: string) => {
    const data = await authApi.login(slug, email, password);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('tenantSlug', slug);
    setAccessToken(data.accessToken);
    return data;
  }, []);

  const logout = useCallback(async () => {
    const rt = localStorage.getItem('refreshToken');
    if (rt) await authApi.logout(rt).catch(() => null);
    localStorage.clear();
    setAccessToken(null);
  }, []);

  const user = accessToken ? parseJwt(accessToken) : null;
  const isAuthenticated = !!accessToken && !!user;

  return { isAuthenticated, user, login, logout, accessToken };
}
