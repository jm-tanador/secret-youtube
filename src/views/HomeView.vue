<template>
  <div class="container">
    <header class="header">
      <input 
        v-model="searchQuery" 
        @keyup.enter="searchVideos" 
        placeholder="Search videos..." 
        class="search-input"
      />
      <button @click="searchVideos" class="search-button">Search</button>
    </header>

    <div v-if="loading" class="loading">Loading...</div>

    <div v-else class="video-grid">
      <div 
        v-for="video in videos" 
        :key="video.id.videoId" 
        class="video-card"
        @click="playVideo(video.id.videoId)"
      >
        <img :src="video.snippet.thumbnails.medium.url" alt="thumbnail" class="thumbnail" />
        <div class="video-info">
          <h3 class="video-title">{{ video.snippet.title }}</h3>
          <p class="channel-title">{{ video.snippet.channelTitle }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      searchQuery: '',
      videos: [],
      loading: false
    };
  },
  methods: {
    async searchVideos() {
      if (!this.searchQuery) return;
      this.loading = true;
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/search`, {
          params: { q: this.searchQuery }
        });
        this.videos = response.data.items || [];
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        this.loading = false;
      }
    },
    playVideo(videoId) {
      this.$router.push({ name: 'watch', params: { id: videoId } });
    }
  },
  mounted() {
    // this.searchQuery = 'programming';
    this.searchVideos();
  }
};
</script>

<style scoped>
.container { padding: 20px; font-family: sans-serif; }
.header { display: flex; gap: 10px; margin-bottom: 20px; }
.search-input { flex: 1; padding: 10px; border: 1px solid #ccc; border-radius: 4px; }
.search-button { padding: 10px 20px; background-color: #ff0000; color: white; border: none; border-radius: 4px; cursor: pointer; }
.video-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
.video-card { cursor: pointer; border: 1px solid #eee; border-radius: 8px; overflow: hidden; background: #fff; transition: transform 0.2s; }
.video-card:hover { transform: scale(1.02); }
.thumbnail { width: 100%; height: auto; }
.video-info { padding: 10px; }
.video-title { font-size: 14px; margin: 0 0 5px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.channel-title { font-size: 12px; color: #606060; margin: 0; }
.loading { text-align: center; font-size: 18px; margin-top: 50px; }
</style>