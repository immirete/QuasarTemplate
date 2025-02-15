<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <q-card class="profile-card">
          <q-card-section class="profile-header">
            <div class="text-center q-mb-md">
              <q-avatar size="150px">
                <img :src="editedProfile.avatarUrl || 'https://cdn.quasar.dev/img/avatar3.svg'">
              </q-avatar>
              <q-btn
                color="primary"
                label="Cambiar Avatar"
                class="q-mt-sm full-width"
                @click="selectAvatar"
                :loading="isUploading"
              />
              <input
                type="file"
                id="avatarInput"
                accept="image/*"
                style="display: none"
                @change="handleAvatarUpload"
              />
            </div>

            <div v-if="!editing" class="text-center">
              <h4 class="q-mb-sm">{{ editedProfile.firstName }} {{ editedProfile.lastName }}</h4>
              <p class="text-grey-7">{{ editedProfile.email }}</p>
              <p class="q-mt-md">{{ editedProfile.bio }}</p>
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

            <q-form v-else @submit="saveProfileData" class="q-gutter-md">
              <q-input
                v-model="editedProfile.firstName"
                label="Nombre"
                :rules="[val => !!val || 'El nombre es requerido']"
              />
              <q-input
                v-model="editedProfile.lastName"
                label="Apellidos"
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
                  :loading="isSaving"
                  :disable="isSaving"
                />
                <q-btn
                  flat
                  color="grey"
                  label="Cancelar"
                  @click="cancelEditing"
                  :disable="isSaving"
                />
              </div>
            </q-form>
          </q-card-section>
        </q-card>

        <div class="q-mt-lg">
          <div class="text-h6 q-mb-md">Mis Tweets (Ejemplo - No implementado completamente)</div>
          <div>
            <p class="text-grey-8">Funcionalidad de Tweets no implementada en este ejemplo.</p>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from 'src/stores/auth';
import { useRouter } from 'vue-router';
import { api } from 'boot/axios';
import { useQuasar } from 'quasar';

const authStore = useAuthStore();
const router = useRouter();
const $q = useQuasar();

const editing = ref(false);
const isSaving = ref(false);
const isUploading = ref(false);

interface ApiResponse<T> {
  message: string;
  data: T;
}

interface EditedProfile {
  firstName?: string;
  lastName?: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
}

const editedProfile = ref<EditedProfile>({
  email: '',
});

onMounted(async () => {
  await fetchProfile();
});

const fetchProfile = async () => {
  if (!authStore.userId) {
    $q.notify({
      color: 'negative',
      message: 'No hay sesión de usuario activa',
      icon: 'error'
    });
    router.push('/login');
    return;
  }

  try {
    const response = await api.get<ApiResponse<EditedProfile>>(`/profile/${authStore.userId}`);
    editedProfile.value = response.data.data;
  } catch (error: any) {
    console.error('Error fetching profile:', error);
    $q.notify({
      color: 'negative',
      message: error.response?.data?.message || 'Error al cargar el perfil',
      icon: 'error'
    });

    if (error.response?.status === 401 || error.response?.status === 403) {
      router.push('/login');
    }
  }
};

const logout = async () => {
  await authStore.logout();
  router.push('/login');
};

function startEditing() {
  editing.value = true;
}

function cancelEditing() {
  editing.value = false;
}

const saveProfileData = async () => {
  isSaving.value = true;
  try {
    await api.put(`/profile/${authStore.userId}`, editedProfile.value);
    await fetchProfile();
    editing.value = false;
    $q.notify({
      type: 'positive',
      message: 'Perfil actualizado correctamente',
      icon: 'check_circle'
    });
  } catch (error: any) {
    console.error('Error saving profile data:', error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al actualizar el perfil',
      icon: 'error'
    });
  } finally {
    isSaving.value = false;
  }
};

const selectAvatar = () => {
  document.getElementById('avatarInput')?.click();
};

const handleAvatarUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const files = target.files;

  if (!files || files.length === 0) return;

  const file = files[0];
  isUploading.value = true;

  try {
    const formData = new FormData();
    formData.append('avatar', file, file.name);

    console.log('Uploading avatar...', {
      userId: authStore.userId,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size
    });

    const response = await api.put(`/profile/${authStore.userId}/avatar`, formData);
    console.log('Upload response:', response.data);
    
    await fetchProfile();
    $q.notify({
      type: 'positive',
      message: 'Avatar actualizado correctamente',
      icon: 'check_circle'
    });
  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    $q.notify({
      type: 'negative',
      message: error.response?.data?.message || 'Error al actualizar el avatar',
      icon: 'error'
    });
  } finally {
    isUploading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.profile-card {
  border-radius: 16px;

  .profile-header {
    padding: 24px;
  }
}
</style>
