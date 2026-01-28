import Cookies from 'js-cookie';

/**
 * Cookie utility for managing authentication tokens
 */

const TOKEN_KEY = 'access_token';
const COOKIE_OPTIONS = {
  expires: 7, // 7 days
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
};

export const cookieStorage = {
  /**
   * Get access token from cookies
   */
  getToken: (): string | undefined => {
    return Cookies.get(TOKEN_KEY);
  },

  /**
   * Set access token in cookies
   */
  setToken: (token: string): void => {
    Cookies.set(TOKEN_KEY, token, COOKIE_OPTIONS);
  },

  /**
   * Remove access token from cookies
   */
  removeToken: (): void => {
    Cookies.remove(TOKEN_KEY);
  },

  /**
   * Check if user has token
   */
  hasToken: (): boolean => {
    return !!Cookies.get(TOKEN_KEY);
  },
};

export default cookieStorage;
