import { defineStore } from 'pinia';
import { ref } from 'vue';

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  avatar: string;
}

export const useUserStore = defineStore('user', () => {
  const profile = ref<UserProfile>({
    name: 'Usuario de Prueba',
    email: 'usuario@ejemplo.com',
    bio: 'Bienvenido a mi perfil',
    avatar: 'https://cdn.quasar.dev/img/boy-avatar.png'
  });

  function updateProfile(newProfile: Partial<UserProfile>) {
    profile.value = {
      ...profile.value,
      ...newProfile
    };
  }

  return {
    profile,
    updateProfile
  };
});