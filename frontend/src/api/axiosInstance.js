import axios from 'axios';
import toast from 'react-hot-toast';
import { emitUnauthorized } from '@/utils/authEvents';
import { getErrorMessage } from '@/utils/errorMessage';
import { getToken } from '@/utils/tokenStorage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Single Axios instance for the whole app. Components and pages must never
 * call axios directly — always go through a service in `src/api`.
 *
 * Auth is via a JWT stored client-side (see src/utils/tokenStorage.js),
 * attached to every request as `Authorization: Bearer <token>` below.
 * NOT a cookie: the frontend (vercel.app) and backend (onrender.com) are
 * different domains, and both Safari and a growing share of Chrome block
 * third-party (cross-site) cookies outright regardless of cookie
 * attributes — a Bearer header sidesteps that entirely.
 */
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    // Callers that expect a 401 as part of normal flow (e.g. the initial
    // "am I logged in?" check on app load) can pass `silent401: true` in
    // the request config to suppress the toast + global logout event.
    const silent401 = error?.config?.silent401;

    if (status === 401 && !silent401) {
      toast.error('Your session has expired. Please log in again.');
      emitUnauthorized();
    } else if (status === 403) {
      toast.error(getErrorMessage(error));
    } else if (status === 500 || !error?.response) {
      toast.error(getErrorMessage(error));
    }

    return Promise.reject(error);
  }
);
