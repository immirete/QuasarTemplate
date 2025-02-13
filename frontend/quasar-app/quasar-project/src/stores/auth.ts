import { defineStore } from 'pinia';
import { api } from 'boot/axios';
import type { AxiosError } from 'axios';

interface AuthResponse {
    success: boolean;
    error?: string;
}

interface UserProfile {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatarUrl?: string;
}

interface LoginResponse {
    token: string;
    user: UserProfile;
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
        user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null as UserProfile | null,
    }),
    getters: {
        userId(): string | null {
            return this.user?.id || null;
        }
    },
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
                this.user = response.data.user;

                localStorage.setItem('token', this.token);
                localStorage.setItem('user', JSON.stringify(this.user));
                console.log(localStorage.getItem('user'));
                console.log(localStorage.getItem('token'));
                this.isLoggedIn = true;
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
            localStorage.removeItem('user');
        },
        async getProfile(): Promise<void> {
            if (!this.userId) {
                this.error = 'No user ID available';
                return;
            }

            try {
                const response = await api.get<UserProfile>(`/profile/${this.userId}`);
                this.user = response.data;
                localStorage.setItem('user', JSON.stringify(this.user));
            } catch (error) {
                const axiosError = error as AxiosError<ErrorResponse>;
                this.error = axiosError.response?.data?.message || 'Failed to fetch profile';
                // Si el error es 401 o 403, hacemos logout
                if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
                    this.logout();
                }
                throw error;
            }
        },
    },
});