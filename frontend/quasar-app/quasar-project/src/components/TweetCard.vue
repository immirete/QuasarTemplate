<template>
  <q-card class="tweet-card q-mb-md">
    <q-card-section>
      <div class="row items-center">
        <q-avatar>
          <img :src="tweet.authorAvatar">
        </q-avatar>
        <div class="q-ml-sm">
          <div class="text-weight-bold">{{ tweet.author }}</div>
          <div class="text-grey-7 text-caption">
            {{ tweet.authorEmail }}
          </div>
          <div class="text-grey-7 text-caption">
            {{ formatDate(tweet.createdAt) }}
          </div>
        </div>
      </div>
    </q-card-section>

    <q-card-section>
      <div class="text-body1">
        {{ tweet.content }}
      </div>
    </q-card-section>

    <q-card-actions>
      <q-btn
        flat
        round
        color="blue"
        icon="far fa-comment"
      >
        <q-tooltip>Comentar</q-tooltip>
      </q-btn>
      <q-btn
        flat
        round
        :color="tweet.retweets > 0 ? 'green' : 'dark'"
        icon="fas fa-retweet"
        @click="retweetTweet"
      >
        <q-tooltip>Retwittear</q-tooltip>
      </q-btn>
      <span v-if="tweet.retweets > 0" class="q-ml-sm text-green">
        {{ tweet.retweets }}
      </span>
      <q-btn
        flat
        round
        :color="tweet.likes > 0 ? 'red' : 'dark'"
        :icon="tweet.likes > 0 ? 'fas fa-heart' : 'far fa-heart'"
        @click="likeTweet"
      >
        <q-tooltip>Me gusta</q-tooltip>
      </q-btn>
      <span v-if="tweet.likes > 0" class="q-ml-sm text-red">
        {{ tweet.likes }}
      </span>
    </q-card-actions>
  </q-card>
</template>

<script setup lang="ts">
import { useTweetStore } from 'src/stores/tweet-store';

const props = defineProps<{
  tweet: {
    id: number;
    content: string;
    author: string;
    authorEmail: string;
    authorAvatar: string;
    likes: number;
    retweets: number;
    createdAt: Date;
  }
}>();

const tweetStore = useTweetStore();

function formatDate(date: Date) {
  return new Date(date).toLocaleString('es-ES', {
    month: 'short',
    day: 'numeric'
  });
}

function likeTweet() {
  tweetStore.likeTweet(props.tweet.id);
}

function retweetTweet() {
  tweetStore.retweetTweet(props.tweet.id);
}
</script>

<style lang="scss" scoped>
.tweet-card {
  border-radius: 16px;
  &:hover {
    background: rgba(0,0,0,0.03);
  }
}
</style>