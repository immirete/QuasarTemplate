<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <q-card class="profile-card">
          <q-card-section class="profile-header">
            <div class="text-center q-mb-md">
              <q-avatar size="150px">
                <img :src="userStore.profile.avatar">
              </q-avatar>
            </div>
            
            <div v-if="!editing" class="text-center">
              <h4 class="q-mb-sm">{{ userStore.profile.name }}</h4>
              <p class="text-grey-7">{{ userStore.profile.email }}</p>
              <p class="q-mt-md">{{ userStore.profile.bio }}</p>
              <q-btn
                color="primary"
                label="Editar Perfil"
                @click="startEditing"
                class="q-mt-md"
              />
              <q-btn
        color="primary"
        label="Cerrar sesión"
        @click="logout"
        class="q-mt-md"
      />
            </div>

            <q-form v-else @submit="saveProfile" class="q-gutter-md">
              <q-input
                v-model="editedProfile.name"
                label="Nombre"
                :rules="[val => !!val || 'El nombre es requerido']"
              />
              
              <q-input
                v-model="editedProfile.email"
                label="Email"
                type="email"
                :rules="[
                  val => !!val || 'El email es requerido',
                  val => /^[^@]+@[^@]+\.[^@]+$/.test(val) || 'Email inválido'
                ]"
              />

              <q-input
                v-model="editedProfile.bio"
                label="Bio"
                type="textarea"
                rows="3"
              />

              <div class="row justify-center q-gutter-sm">
                <q-btn
                  type="submit"
                  color="primary"
                  label="Guardar"
                />
                <q-btn
                  flat
                  color="grey"
                  label="Cancelar"
                  @click="cancelEditing"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <div class="q-mt-lg">
          <div class="text-h6 q-mb-md">Mis Tweets</div>
          <TweetCard
            v-for="tweet in userTweets"
            :key="tweet.id"
            :tweet="tweet"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useUserStore } from 'src/stores/user-store';
import { useTweetStore } from 'src/stores/tweet-store';
import TweetCard from 'components/TweetCard.vue';
import { useAuthStore } from 'src/stores/auth';
import { useRouter } from 'vue-router';


const userStore = useUserStore();
const tweetStore = useTweetStore();

const editing = ref(false);
const editedProfile = ref({ ...userStore.profile });
const authStore = useAuthStore();
const router = useRouter();

const logout = async () => {
  await authStore.logout();
  router.push('/login');
};

const userTweets = computed(() => {
  return tweetStore.tweets.filter(tweet => tweet.author === userStore.profile.name);
});

function startEditing() {
  editedProfile.value = { ...userStore.profile };
  editing.value = true;
}

function cancelEditing() {
  editing.value = false;
}

function saveProfile() {
  userStore.updateProfile(editedProfile.value);
  editing.value = false;
}

</script>

<style lang="scss" scoped>
.profile-card {
  border-radius: 16px;
  
  .profile-header {
    padding: 24px;
  }
}
</style>