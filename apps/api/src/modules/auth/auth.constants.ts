export const JWT_TOKEN_TYPE = {
  Access: 'access',
  Refresh: 'refresh',
} as const;

export const AUTH_COOKIE = {
  RefreshToken: 'refresh_token',
  Path: '/api/auth',
} as const;
