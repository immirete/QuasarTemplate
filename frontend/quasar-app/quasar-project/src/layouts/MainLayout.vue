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
          Black Photo
        </q-toolbar-title>
        <q-avatar class="cursor-pointer" @click="router.push('/profile')">
          <img :src="userStore.profile.avatar">
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
              <img :src="userStore.profile.avatar">
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
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserStore } from 'src/stores/user-store';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();
const leftDrawerOpen = ref(false);
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
