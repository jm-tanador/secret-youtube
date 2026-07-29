<template>
  <div class="watch-container">
    <button @click="$router.back()" class="back-button">← Back</button>
    
    <div class="player-wrapper">
      <iframe
        :src="`https://www.youtube-nocookie.com/embed/${videoId}`"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
        class="iframe-player"
      ></iframe>
    </div>

    <div v-if="videoDetails" class="details-section">
      <h1 class="title">{{ videoDetails.snippet.title }}</h1>
      <p class="channel">{{ videoDetails.snippet.channelTitle }}</p>
      <p class="description">{{ videoDetails.snippet.description }}</p>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      videoId: this.$route.params.id,
      videoDetails: null
    };
  },
  async mounted() {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/videos/${this.videoId}`);
      if (response.data.items && response.data.items.length > 0) {
        this.videoDetails = response.data.items[0];
      }
    } catch (error) {
      console.error("Error fetching video details:", error);
    }
  }
};
</script>

<style scoped>
.watch-container { padding: 20px; max-width: 900px; margin: 0 auto; font-family: sans-serif; }
.back-button { padding: 8px 16px; margin-bottom: 15px; cursor: pointer; }
.player-wrapper { position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; background: #000; }
.iframe-player { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }
.details-section { margin-top: 20px; }
.title { font-size: 20px; margin-bottom: 5px; }
.channel { font-size: 14px; color: #606060; margin-bottom: 15px; }
.description { font-size: 14px; line-height: 1.5; white-space: pre-line; background: #f9f9f9; padding: 15px; border-radius: 4px; }
</style>