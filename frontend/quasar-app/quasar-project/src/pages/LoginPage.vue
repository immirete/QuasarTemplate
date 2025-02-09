// frontend/my-app-quasar/src/pages/LoginPage.vue
<template>
  <q-page class="flex flex-center bg-grey-1">
    <div class="column items-center" style="width: 350px">
      <!-- Card principal -->
      <q-card flat bordered class="q-pa-lg shadow-1 full-width">
        <q-card-section class="text-center q-pb-lg">
          <div class="text-h4 text-weight-bold" style="font-family: 'Instagram Sans', sans-serif;">
            Calistenic
          </div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="submitLogin" class="q-gutter-md">
            <q-input
              outlined
              v-model="email"
              label="Email"
              type="email"
              class="bg-white"
              dense
              :rules="[val => val && val.length > 0 || 'Please enter your email']"
            />

            <q-input
              outlined
              v-model="password"
              label="Password"
              :type="isPwd ? 'password' : 'text'"
              class="bg-white"
              dense
              :rules="[val => val && val.length > 0 || 'Please enter your password']"
            >
              <template v-slot:append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>

            <q-btn
              unelevated
              color="primary"
              class="full-width"
              size="lg"
              label="Log In"
              type="submit"
              :loading="authStore.loading"
            />

            <div class="text-center q-py-sm">
              <q-separator class="q-my-md" />
              <div class="row items-center justify-center q-gutter-x-sm">
                <div class="text-grey-6">Don't have an account?</div>
                <q-btn flat color="primary" label="Sign up" to="/register" />
              </div>
            </div>
          </q-form>
        </q-card-section>
      </q-card>

      <!-- Mensaje de error -->
      <q-banner v-if="authStore.error" class="bg-negative text-white q-mt-md">
        {{ authStore.error }}
      </q-banner>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { onMounted } from 'vue';

const email = ref('');
const password = ref('');
const isPwd = ref(true);
const router = useRouter();
const authStore = useAuthStore();

onMounted(async () => {
  if (authStore.isLoggedIn) {
    await router.push('/home').catch(() => {
      // Manejar error silenciosamente
    });
  }
});

const submitLogin = async () => {
  const result = await authStore.login(email.value, password.value);
  if (result.success) {
    await router.push('/home').catch(() => {
      // Manejar error silenciosamente
    });
  }
};
</script>

<style lang="scss" scoped>
:deep(.q-field__control) {
  height: 36px;
  padding: 0 8px;
}

.q-btn {
  height: 32px;
  font-weight: 600;
}
</style>