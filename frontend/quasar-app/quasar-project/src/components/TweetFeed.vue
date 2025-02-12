<template>
  <div class="tweet-feed">
    <CreateTweet />
    <div class="q-pa-md">
      <template v-if="tweetStore.tweets.length">
        <TweetCard
          v-for="tweet in tweetStore.tweets"
          :key="tweet.id"
          :tweet="tweet"
        />
      </template>
      <div v-else class="text-center q-pa-lg text-grey-7">
        No hay tweets aún. ¡Sé el primero en twittear!
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTweetStore } from 'src/stores/tweet-store';
import CreateTweet from './CreateTweet.vue';
import TweetCard from './TweetCard.vue';

const tweetStore = useTweetStore();
</script>

<style lang="scss" scoped>
.tweet-feed {
  max-width: 600px;
  margin: 0 auto;
  border-left: 1px solid #e1e8ed;
  border-right: 1px solid #e1e8ed;
}
</style>