<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-white text-black">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <q-toolbar-title class="text-primary text-weight-bold">
          Calistenics
        </q-toolbar-title>
        <q-avatar class="cursor-pointer" @click="router.push('/profile')">
          <img :src="avatarUrl" @error="onImageError">
          <q-tooltip>Mi Perfil</q-tooltip>
        </q-avatar>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      bordered
      :width="280"
      :breakpoint="500"
    >
      <q-list padding>
        <q-item
          clickable
          v-ripple
          to="/"
          exact
        >
          <q-item-section avatar>
            <q-icon name="home" size="md" :color="route.path === '/' ? 'primary' : 'grey'" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">Inicio</q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          v-ripple
          to="/profile"
          exact
        >
          <q-item-section avatar>
            <q-icon name="person" size="md" :color="route.path === '/profile' ? 'primary' : 'grey'" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">Perfil</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="tag" size="md" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">Explorar</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="notifications" size="md" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">Notificaciones</q-item-label>
          </q-item-section>
        </q-item>

        <q-item clickable v-ripple>
          <q-item-section avatar>
            <q-icon name="mail" size="md" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-bold">Mensajes</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <q-item class="fixed-bottom q-pb-lg">
        <q-item-section>
          <div class="row items-center">
            <q-avatar size="md">
              <img :src="avatarUrl" @error="onImageError">
            </q-avatar>
            <div class="q-ml-sm">
              <div class="text-weight-bold">{{ userStore.profile.name }}</div>
              <div class="text-grey-7 text-caption">{{ userStore.profile.email }}</div>
            </div>
          </div>
        </q-item-section>
      </q-item>
    </q-drawer>

    <q-page-container>
      <router-view @profile-updated="updateAvatar" />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/user-store';
import { api } from 'src/boot/axios';
import { useAuthStore } from 'src/stores/auth';

const API_URL = process.env.API_URL || 'https://api-calistenics.duckdns.org';
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/8847/8847419.png';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const leftDrawerOpen = ref(false);
const avatarFilename = ref('');

const avatarUrl = computed(() => {
  if (!avatarFilename.value) return DEFAULT_AVATAR;
  return `${API_URL}/api/v1/profile/images/profile-images/${avatarFilename.value}`;
});

const updateAvatar = (filename: string) => {
  console.log('Actualizando avatar:', filename);
  avatarFilename.value = filename;
};

const onImageError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.src = DEFAULT_AVATAR;
};

const fetchInitialAvatar = async () => {
  if (!authStore.userId) return;
  
  try {
    const response = await api.get(`/profile/${authStore.userId}`);
    if (response.data.data?.avatarUrl) {
      const filename = response.data.data.avatarUrl.split('/').pop();
      if (filename) {
        updateAvatar(filename);
      }
    }
  } catch (error) {
    console.error('Error fetching avatar:', error);
  }
};

onMounted(() => {
  fetchInitialAvatar();
});
</script>

<style lang="scss">
.q-toolbar {
  min-height: 53px;
}

.q-drawer {
  .q-item {
    border-radius: 8px;
    margin: 4px 8px;
  }
}
</style>
