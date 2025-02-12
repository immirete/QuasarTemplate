import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useUserStore } from './user-store';

interface Tweet {
  id: number;
  content: string;
  author: string;
  authorEmail: string;
  authorAvatar: string;
  likes: number;
  retweets: number;
  createdAt: Date;
}

export const useTweetStore = defineStore('tweet', () => {
  const tweets = ref<Tweet[]>([]);
  const userStore = useUserStore();
  let nextId = 1;

  function addTweet(content: string) {
    const tweet: Tweet = {
      id: nextId++,
      content,
      author: userStore.profile.name,
      authorEmail: userStore.profile.email,
      authorAvatar: userStore.profile.avatar,
      likes: 0,
      retweets: 0,
      createdAt: new Date()
    };
    tweets.value.unshift(tweet);
  }

  function likeTweet(id: number) {
    const tweet = tweets.value.find(t => t.id === id);
    if (tweet) {
      tweet.likes++;
    }
  }

  function retweetTweet(id: number) {
    const tweet = tweets.value.find(t => t.id === id);
    if (tweet) {
      tweet.retweets++;
    }
  }

  return {
    tweets,
    addTweet,
    likeTweet,
    retweetTweet
  };
});