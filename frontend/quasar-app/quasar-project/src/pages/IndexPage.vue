<template>
  <q-page>
    <div class="row justify-center">
      <div class="col-12 col-md-8 col-lg-6">
        <div class="text-h6 q-pa-md q-pb-none">Inicio</div>
        <TweetFeed />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import TweetFeed from 'components/TweetFeed.vue';
</script>

<style lang="scss" scoped>
.q-page {
  background-color: #fff;
}
</style>
