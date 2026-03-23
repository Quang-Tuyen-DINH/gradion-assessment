export type JwtPayload = {
  sub: string;
  email: string;
  role: 'user' | 'admin';
};

export function decodeToken(): JwtPayload | null {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload)) as JwtPayload;
  } catch {
    return null;
  }
}

export function getRole(): 'user' | 'admin' | null {
  return decodeToken()?.role ?? null;
}

export function isAdmin(): boolean {
  return getRole() === 'admin';
}
