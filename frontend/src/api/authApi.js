import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from '@/constants/endpoints';

export const authApi = {
  register: async ({ username, phone, email, password }) => {
    const { data } = await axiosInstance.post(ENDPOINTS.AUTH.REGISTER, {
      username,
      phone,
      email,
      password,
    });
    // Backend returns { success, message, user } but does NOT log the user
    // in (no cookie is set on register) — caller should redirect to /login.
    return data;
  },

  login: async ({ email, password }) => {
    const { data } = await axiosInstance.post(ENDPOINTS.AUTH.LOGIN, { email, password });
    // Backend returns only { message } here. It does not return the user
    // object, so the caller must follow up with authApi.getMe().
    return data;
  },

  logout: async () => {
    const { data } = await axiosInstance.post(ENDPOINTS.AUTH.LOGOUT);
    return data;
  },

  /**
   * NOTE: the backend's GET /api/auth/me handler returns the *raw*
   * node-postgres query result instead of unwrapping it, i.e.
   *   { user: { rows: [ {...actualUser} ], rowCount: 1, ... } }
   * instead of { user: {...actualUser} }. We unwrap it here so the rest
   * of the app can treat `getMe()` as returning a plain user object or
   * null — if the backend is fixed later, update this one line.
   */
  getMe: async (config = {}) => {
    const { data } = await axiosInstance.get(ENDPOINTS.AUTH.ME, config);
    return data?.user?.rows?.[0] ?? null;
  },
};
