import { boot } from 'quasar/wrappers';
import axios, { type AxiosInstance } from 'axios';

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $axios: AxiosInstance;
    }
}

const api = axios.create({
    baseURL: 'https://api-calistenics.duckdns.org', // API Gateway URL
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add a request interceptor
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    // Para subida de archivos, no establecer Content-Type
    if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Add a response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        if (error.code === 'ERR_NETWORK') {
            console.error('Network error - checking connection to:', error.config?.url);
        }
        return Promise.reject(error);
    }
);

export default boot(({ app }) => {
    app.config.globalProperties.$axios = axios;
    app.config.globalProperties.$api = api;
});

export { api };
