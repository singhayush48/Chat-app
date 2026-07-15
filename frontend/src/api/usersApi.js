import { axiosInstance } from './axiosInstance';
import { ENDPOINTS } from '@/constants/endpoints';

export const usersApi = {
  getAll: async () => {
    const { data } = await axiosInstance.get(ENDPOINTS.USERS.ALL);
    return data.users;
  },

  /**
   * NOTE: the backend query param is `name`, not `q` as originally
   * documented, and it 404s (not an empty array) when nothing matches.
   */
  search: async (query) => {
    try {
      const { data } = await axiosInstance.get(ENDPOINTS.USERS.SEARCH, {
        params: { name: query },
      });
      return data.users;
    } catch (error) {
      if (error?.response?.status === 404) return [];
      throw error;
    }
  },

  /** Public profile for the "view this user's profile" drawer. */
  getById: async (userId) => {
    const { data } = await axiosInstance.get(ENDPOINTS.USERS.BY_ID(userId));
    return data.user;
  },

  updateProfile: async ({ username, phone, bio }) => {
    const { data } = await axiosInstance.patch(ENDPOINTS.USERS.UPDATE_ME, {
      username,
      phone,
      bio,
    });
    return data.user;
  },

  updateAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await axiosInstance.post(ENDPOINTS.USERS.UPDATE_AVATAR, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.user;
  },
};
