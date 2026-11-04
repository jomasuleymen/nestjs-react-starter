export interface TokenStorage {
  clear(): void;
  get(): string | null;
  set(token: string): void;
}

const accessTokenKey = 'access-token';

export const tokenStorage: TokenStorage = {
  clear: () => {
    localStorage.removeItem(accessTokenKey);
  },
  get: () => localStorage.getItem(accessTokenKey),
  set: (token) => {
    localStorage.setItem(accessTokenKey, token);
  },
};
