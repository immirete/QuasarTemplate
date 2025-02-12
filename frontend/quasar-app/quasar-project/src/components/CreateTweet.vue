<template>
  <div class="q-pa-md">
    <q-card class="tweet-composer">
      <q-card-section>
        <q-input
          v-model="tweetContent"
          type="textarea"
          placeholder="¿Qué está pasando?"
          autogrow
          :maxlength="280"
          class="no-border"
          @keyup.enter="handleSubmit"
        >
          <template v-slot:after>
            <div class="row items-center">
              <span class="q-mr-sm text-grey-7">{{ 280 - tweetContent.length }}</span>
              <q-btn
                :disable="!tweetContent.length"
                color="primary"
                rounded
                label="Twittear"
                @click="handleSubmit"
              />
            </div>
          </template>
        </q-input>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useTweetStore } from 'src/stores/tweet-store';

const tweetStore = useTweetStore();
const tweetContent = ref('');

function handleSubmit() {
  if (tweetContent.value.trim()) {
    tweetStore.addTweet(tweetContent.value);
    tweetContent.value = '';
  }
}
</script>

<style lang="scss" scoped>
.tweet-composer {
  border-radius: 16px;
  .no-border {
    .q-field__control {
      border: none !important;
    }
  }
}
</style>