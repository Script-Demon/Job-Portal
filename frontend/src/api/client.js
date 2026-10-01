import axios from 'axios';

const TOKEN_KEY = 'jp_token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

client.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => {
  onUnauthorized = fn;
};

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || '';
    if (status === 401 && !url.startsWith('/auth/') && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

/** Extracts a human-readable message from an API error. */
export async function errorMessage(error, fallback = 'Something went wrong') {
  let data = error?.response?.data;
  if (data instanceof Blob) {
    try {
      data = JSON.parse(await data.text());
    } catch {
      data = null;
    }
  }
  if (data?.fieldErrors) {
    return Object.entries(data.fieldErrors)
      .map(([field, msg]) => `${field}: ${msg}`)
      .join('; ');
  }
  if (data?.message) return data.message;
  if (!error?.response) return 'Cannot reach the server. Is the backend running?';
  return fallback;
}

export function fieldErrors(error) {
  return error?.response?.data?.fieldErrors || {};
}

export default client;
