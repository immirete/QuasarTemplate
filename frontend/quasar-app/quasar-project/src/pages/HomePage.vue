<template>
  <q-page class="flex flex-center bg-grey-1">
    <div class="column items-center q-pa-md">
      <h1 class="text-h3 q-mb-md">Bienvenido a tu página personal prueba</h1>
      <q-btn
        color="primary"
        label="Cerrar sesión"
        @click="logout"
        class="q-mt-md"
      />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useAuthStore } from 'src/stores/auth';
import { useRouter } from 'vue-router';

const authStore = useAuthStore();
const router = useRouter();

const logout = async () => {
  await authStore.logout();
  router.push('/login');
};
</script>