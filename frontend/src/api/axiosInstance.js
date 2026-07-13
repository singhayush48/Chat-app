import axios from 'axios';
import toast from 'react-hot-toast';
import { emitUnauthorized } from '@/utils/authEvents';
import { getErrorMessage } from '@/utils/errorMessage';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * Single Axios instance for the whole app. Components and pages must never
 * call axios directly — always go through a service in `src/api`.
 *
 * Auth is via an httpOnly cookie set by the backend, so we never attach an
 * Authorization header; `withCredentials` ensures the cookie is sent.
 */
export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => config,
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
