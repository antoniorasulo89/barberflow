import { useState, useCallback } from 'react';

const API = import.meta.env.VITE_API_URL ?? '/api';

export function useClientAuth(slug: string) {
  const tokenKey = `clientToken_${slug}`;
  const nameKey = `clientNome_${slug}`;

  const [token, setToken] = useState<string | null>(localStorage.getItem(tokenKey));
  const [nome, setNome] = useState<string | null>(localStorage.getItem(nameKey));

  const login = useCallback(async (telefono: string) => {
    const res = await fetch(`${API}/public/${slug}/client/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telefono }),
    });
    const data = await res.json();
    if (!res.ok) throw data;
    localStorage.setItem(tokenKey, data.clientToken);
    localStorage.setItem(nameKey, data.nome);
    setToken(data.clientToken);
    setNome(data.nome);
  }, [slug, tokenKey, nameKey]);

  const logout = useCallback(() => {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(nameKey);
    setToken(null);
    setNome(null);
  }, [tokenKey, nameKey]);

  return { token, nome, isAuthenticated: !!token, login, logout };
}
