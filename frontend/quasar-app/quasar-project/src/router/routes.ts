import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';

const routes: RouteRecordRaw[] = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/home',
        component: () => import('pages/HomePage.vue'),
        beforeEnter: (to, from, next) => {
            const authStore = useAuthStore();
            if (authStore.isLoggedIn) {
                next();
            } else {
                next('/login');
            }
        }
    },
    {
        path: '/login',
        component: () => import('pages/LoginPage.vue')
    },
    {
        path: '/register',
        component: () => import('pages/RegisterPage.vue')
    },
    {
        path: '/:catchAll(.*)*',
        component: () => import('pages/ErrorNotFound.vue')
    }
];

export default routes;