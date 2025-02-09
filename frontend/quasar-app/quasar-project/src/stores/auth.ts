import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import type { AxiosError } from 'axios';

interface AuthResponse {
    success: boolean;
    error?: string;
}

interface LoginResponse {
    token: string;
    user: {
        email: string;
    };
}

interface ErrorResponse {
    message: string;
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('token') || '',
        isLoggedIn: !!localStorage.getItem('token'),
        loading: false,
        error: null as string | null,
        user: null as { email: string } | null,
    }),
    actions: {
        async register(email: string, password: string): Promise<AuthResponse> {
            this.loading = true;
            this.error = null;
            try {
                await api.post('/register', { email, password });
                this.loading = false;
                return { success: true };
            } catch (error) {
                const axiosError = error as AxiosError<ErrorResponse>;
                this.error = axiosError.response?.data?.message || 'Registration failed';
                this.loading = false;
                return { success: false, error: this.error };
            }
        },
        async login(email: string, password: string): Promise<AuthResponse> {
            this.loading = true;
            this.error = null;
            try {
                const response = await api.post<LoginResponse>('/login', { email, password });
                this.token = response.data.token;
                localStorage.setItem('token', this.token);
                this.isLoggedIn = true;
                this.user = response.data.user;
                this.loading = false;
                return { success: true };
            } catch (error) {
                const axiosError = error as AxiosError<ErrorResponse>;
                this.error = axiosError.response?.data?.message || 'Login failed';
                this.loading = false;
                this.isLoggedIn = false;
                localStorage.removeItem('token');
                return { success: false, error: this.error };
            }
        },
        logout() {
            this.token = '';
            this.isLoggedIn = false;
            this.user = null;
            localStorage.removeItem('token');
        },
    },
});