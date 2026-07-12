import axios, { AxiosError, AxiosInstance } from 'axios';
import { LANDBIT_BACKEND } from '../utils/config';
import { formatUrl } from '../helpers/apis/apiHelpers';
import store from '../redux/Store';
import { setAuthToken } from '../redux/Slices/user.slice';
import { statusCodes } from '../constants/redux/auth/authConstants';
import { API_ENDPOINTS } from '../constants/apis/apiEndpoints';

const landbitBackendUrl: AxiosInstance = axios.create({
  baseURL: LANDBIT_BACKEND,
});

// ---- Refresh Token Logic ---- //
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

landbitBackendUrl.interceptors.request.use((config) => {
  const token = store.getState().user.authToken;

  // Case 1: skipAuth → no token at all
  if (config.headers?.skipAuth) {
    delete config.headers.skipAuth;
    return config;
  }

  // Case 2: customAuth → use a different token for this API
  if (config.headers?.customToken) {
    config.headers['Authorization'] = `Bearer ${config.headers.customAuth}`;
    delete config.headers.customAuth; // prevent sending raw field
    return config;
  }

  // Case 3: default → global auth token
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

landbitBackendUrl.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    const authToken = store.getState().user.authToken;

    if (
      error.response?.status === statusCodes?.UnauthorizedAccess &&
      !originalRequest._retry &&
      authToken
    ) {
      //401
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
            }
            return axios(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = store.getState().user.refreshAuthToken;
        const { data } = await axios.post(
          `${LANDBIT_BACKEND}${API_ENDPOINTS.GET.REFRESH_TOKEN}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const newAccessToken = data?.data?.token;

        // Save to Redux
        store.dispatch(setAuthToken(newAccessToken));

        // Update axios default headers for all future requests
        landbitBackendUrl.defaults.headers.common['Authorization'] =
          `Bearer ${newAccessToken}`;

        // Also update originalRequest header before retry
        if (originalRequest.headers) {
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);

        // retry the failed request with the new token
        return axios(originalRequest);
      } catch (err) {
        processQueue(err, null);
        store.dispatch(setAuthToken(''));
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Axios GET request
export const axiosGetRequest = async (
  instance: any,
  endPoint: string,
  params: Record<string, any> = {},
  showToaster: boolean = false,
  token?: boolean,
  customToken?: string
) => {
  try {
    const formattedUrl = formatUrl(endPoint, params);
    const headers: Record<string, any> = {};

    if (customToken) {
      headers.Authorization = customToken;
    } else if (!token) {
      headers.skipAuth = true;
    }
    const { data } = await instance.get(formattedUrl, {
      headers,
    });

    if (showToaster && data?.message) {
      console.log(data.message);
    }

    return data;
  } catch (err: any) {
    if (showToaster) {
      console.error(err?.response?.data?.message || err.message);
    }
    throw err;
  }
};

// Axios POST request
export const axiosPostRequest = async (
  instance: any,
  endPoint: string,
  data: Record<string, any> = {},
  params: Record<string, any> = {},
  showToaster: boolean = false,
  token?: boolean,
  customToken?: string
) => {
  try {
    const formattedUrl = formatUrl(endPoint);
    const headers: Record<string, any> = {};

    if (customToken) {
      headers.Authorization = `Bearer ${customToken}`;
    } else if (!token) {
      headers.skipAuth = true;
    }

    const response = await instance.post(formattedUrl, data, {
      params,
      headers,
    });

    if (showToaster && response?.data?.message) {
      console.log(response.data.message);
    }

    return response.data;
  } catch (err: any) {
    if (showToaster) {
      console.error(err?.response?.data?.message || err.message);
    }
    throw err;
  }
};

// Axios PUT request
export const axiosPutRequest = async (
  instance: any,
  endPoint: string,
  data: Record<string, any> = {},
  params: Record<string, any> = {},
  showToaster: boolean = false,
  token?: boolean,
  customToken?: string
) => {
  try {
    const formattedUrl = formatUrl(endPoint);
    const headers: Record<string, any> = {};

    if (customToken) {
      headers.Authorization = customToken;
    } else if (!token) {
      headers.skipAuth = true;
    }
    const response = await instance.put(formattedUrl, data, {
      params,
      headers,
    });

    if (showToaster && response?.data?.message) {
      console.log(response.data.message);
    }

    return response.data;
  } catch (err: any) {
    if (showToaster) {
      console.error(err?.response?.data?.message || err.message);
    }
    throw err;
  }
};

// Axios DELETE request
export const axiosDeleteRequest = async (
  instance: any,
  endPoint: string,
  params: Record<string, any> = {},
  showToaster: boolean = false
) => {
  try {
    const formattedUrl = formatUrl(endPoint, params);
    const response = await instance.delete(formattedUrl);

    if (showToaster && response?.data?.message) {
      console.log(response.data.message);
    }

    return response.data;
  } catch (err: any) {
    if (showToaster) {
      console.error(err?.response?.data?.message || err.message);
    }
    throw err;
  }
};

export { landbitBackendUrl };
