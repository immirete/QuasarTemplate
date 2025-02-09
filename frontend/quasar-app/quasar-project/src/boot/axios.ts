import { boot } from 'quasar/wrappers';
import axios, { type AxiosInstance } from 'axios';

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $axios: AxiosInstance;
    }
}

const api = axios.create({ baseURL: 'http://192.168.1.135:3000' }); // API Gateway URL

export default boot(({ app }) => {
    app.config.globalProperties.$axios = axios;
    app.config.globalProperties.$api = api;
});

export { api };