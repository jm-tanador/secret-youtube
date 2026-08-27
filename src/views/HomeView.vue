<template>
  <div class="yt-app-layout">
      <!-- 1. YouTube Header Navigation -->
      <header class="yt-header">
          <div class="header-left">
              <div class="logo-container" @click="resetToHome">
                  <v-icon icon="mdi-youtube" size="large" class="logo-icon"></v-icon>
                  <span class="logo-text">Ebutuoy</span>
              </div>
          </div>

          <div class="header-center">
              <div class="search-wrapper">
                  <v-text-field 
                      v-model="searchQuery" 
                      @keyup.enter="searchVideos" 
                      placeholder="Search" 
                      class="yt-search-input"
                      bg-color="#121212"
                      clearable
                      hide-details
                      variant="solo"
                      density="compact"
                      flat
                      autocomplete="off"
                  />
                  <button @click="searchVideos" class="yt-search-btn">
                      <v-icon icon="mdi-magnify" class="search-icon"></v-icon>
                  </button>
              </div>
          </div>

          <div class="wip blink-warning header-right">
              <i class="mdi mdi-alert"></i> 
              <span class="wip-text">Work in progress...</span>
          </div>
      </header>

      <div class="main-body">
          <!-- 3. Main Feed -->
          <main class="yt-content-feed">
              <!-- Loader -->
              <div v-if="loading" class="loading-wrapper">
                  <v-progress-circular indeterminate color="red" size="48"></v-progress-circular>
              </div>

              <!-- Video Grid -->
              <div v-else class="yt-video-grid">
                  <div 
                      v-for="video in videos" 
                      :key="getVideoId(video)" 
                      class="yt-video-card"
                      @click="playVideo(getVideoId(video))"
                  >
                      <div class="thumbnail-container">
                          <img 
                              :src="video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url" 
                              alt="thumbnail" 
                              class="yt-thumbnail" 
                          />
                          <!-- DURATION BADGE -->
                          <span 
                              v-if="video.contentDetails?.duration" 
                              class="duration-badge"
                          >
                              {{ formatDuration(video.contentDetails.duration) }}
                          </span>
                      </div>
                      
                      <div class="yt-video-details">
                          <v-avatar color="grey-darken-3" size="36" class="avatar-channel mr-3 mt-1 text-white">
                              <span class="text-caption text-uppercase font-weight-bold">
                                  {{ video.snippet?.channelTitle ? video.snippet.channelTitle.charAt(0) : 'Y' }}
                              </span>
                          </v-avatar>
                          <div class="details-metadata">
                              <h3 class="yt-video-title">{{ decodeHtml(video.snippet?.title || '') }}</h3>
                              <p class="yt-channel-name">{{ video.snippet?.channelTitle }}</p>
                              <!-- Real Views & Date -->
                              <p class="yt-views-time">
                                  {{ formatViews(video.statistics?.viewCount) }} • {{ timeAgo(video.snippet?.publishedAt) }}
                              </p>
                          </div>
                      </div>
                  </div>
              </div>
          </main>
      </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'HomeView',
  data() {
      return {
          searchQuery: 'Trending',
          videos: [],
          loading: false
      };
  },
  methods: {
      async searchVideos() {
          if (!this.searchQuery) return;
          this.loading = true;

          this.$router.push({ query: { search_query: this.searchQuery } });

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
      getVideoId(video) {
          if (typeof video.id === 'object' && video.id !== null) {
              return video.id.videoId || '';
          }
          return video.id || '';
      },
      playVideo(videoId) {
          if (!videoId) return;
          this.$router.push({ name: 'watch', params: { id: videoId } });
      },
      resetToHome() {
          this.searchQuery = 'Trending';
          this.searchVideos();
      },
      decodeHtml(html) {
          const txt = document.createElement("textarea");
          txt.innerHTML = html;
          return txt.value;
      },
      formatDuration(isoDuration) {
          if (!isoDuration) return '';
          
          const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          if (!match) return '';

          const hours = parseInt(match[1] || 0, 10);
          const minutes = parseInt(match[2] || 0, 10);
          const seconds = parseInt(match[3] || 0, 10);

          const formattedSeconds = seconds.toString().padStart(2, '0');

          if (hours > 0) {
              const formattedMinutes = minutes.toString().padStart(2, '0');
              return `${hours}:${formattedMinutes}:${formattedSeconds}`;
          }

          return `${minutes}:${formattedSeconds}`;
      },
      formatViews(views) {
          if (views === undefined || views === null || views === '') return 'No views';
          const num = Number(views);
          if (isNaN(num)) return '0 views';

          if (num >= 1_000_000_000) {
              return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B views';
          }
          if (num >= 1_000_000) {
              return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M views';
          }
          if (num >= 1_000) {
              return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K views';
          }
          return `${num} ${num === 1 ? 'view' : 'views'}`;
      },
      timeAgo(dateString) {
          if (!dateString) return '';
          const date = new Date(dateString);
          const now = new Date();
          const seconds = Math.floor((now - date) / 1000);

          if (seconds < 60) return 'Just now';

          const intervals = [
              { label: 'year', seconds: 31536000 },
              { label: 'month', seconds: 2592000 },
              { label: 'week', seconds: 604800 },
              { label: 'day', seconds: 86400 },
              { label: 'hour', seconds: 3600 },
              { label: 'minute', seconds: 60 }
          ];

          for (const interval of intervals) {
              const count = Math.floor(seconds / interval.seconds);
              if (count >= 1) {
                  return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
              }
          }
          return 'Just now';
      }
  },
  mounted() {
      const queryParam = this.$route.query.search_query;
      if (queryParam) {
          this.searchQuery = queryParam;
      } else {
          this.searchQuery = 'Trending';
      }
      this.searchVideos();
  }
};
</script>

<style scoped>
.yt-app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #0f0f0f;
  color: #f1f1f1;
  font-family: Roboto, Arial, sans-serif;
}

.yt-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #0f0f0f;
  padding: 0 16px;
  height: 56px;
}

.header-left {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.logo-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
  gap: 4px;
}

.logo-icon {
  font-size: 28px !important;
  color: #ff0000;
}

.logo-text {
  font-size: 20px;
  font-weight: bold;
  letter-spacing: -0.5px;
  font-family: "Oswald", "Arial Black", sans-serif;
  color: #f1f1f1;
}

.header-center {
  display: flex;
  align-items: center;
  flex: 0 1 680px;
  margin: 0 16px;
  min-width: 0; /* Prevents flex items from overflowing */
}

.search-wrapper {
  display: flex;
  width: 100%;
  border: 1px solid #303030;
  border-radius: 40px;
  background-color: #121212;
  overflow: hidden;
}

.yt-search-input {
  width: 100%;
  border: none;
  font-size: 15px;
  outline: none;
}

.yt-search-btn {
  background-color: #222222;
  border: none;
  border-left: 1px solid #303030;
  padding: 0 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #f1f1f1;
  flex-shrink: 0;
}

.yt-search-btn:hover {
  background-color: #272727;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.main-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.wip {
  font-family: 'Playfair Display', serif;
  font-size: 1.1rem;
  font-weight: bold;
}

.blink-warning {
  color: red;
  font-weight: bold;
  animation: pulse-red 1.5s infinite;
}

@keyframes pulse-red {
  0% { opacity: 1; }
  50% { opacity: 0.2; }
  100% { opacity: 1; }
}

.yt-content-feed {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  background-color: #0f0f0f;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50vh;
}

.yt-video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 32px 16px;
}

.yt-video-card {
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.thumbnail-container {
  width: 100%;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  background-color: #000;
  aspect-ratio: 16 / 9;
}

.yt-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.2s;
}

.yt-video-card:hover .yt-thumbnail {
  opacity: 0.9;
}

.duration-badge {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
  padding: 2px 4px;
  border-radius: 4px;
  letter-spacing: 0.5px;
  user-select: none;
}

.yt-video-details {
  display: flex;
  margin-top: 12px;
  align-items: flex-start;
}

.details-metadata {
  flex: 1;
}

.yt-video-title {
  font-size: 14px;
  font-weight: 550;
  color: #f1f1f1;
  line-height: 20px;
  margin: 0 0 4px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.yt-channel-name {
  font-size: 12px;
  color: #aaaaaa;
  margin: 0;
}

.yt-views-time {
  font-size: 12px;
  color: #aaaaaa;
  margin: 2px 0 0 0;
}

/* ==========================================================================
   RESPONSIVE MEDIA QUERIES
   ========================================================================== */

/* Tablets & Small Laptops (max-width: 768px) */
@media (max-width: 768px) {
  .yt-header {
    padding: 0 12px;
    height: 52px;
  }

  .header-center {
    margin: 0 8px;
  }

  .yt-search-btn {
    padding: 0 12px;
  }

  .wip {
    font-size: 0.85rem;
  }

  .yt-content-feed {
    padding: 16px 12px;
  }

  .yt-video-grid {
    grid-template-columns: 1fr; /* Single column on tablets & mobile */
    gap: 24px;
  }
}

/* Mobile Devices (max-width: 480px) */
@media (max-width: 480px) {
  .yt-header {
    padding: 0 8px;
    height: 48px;
  }

  /* Hide the text part of the logo and WIP to save valuable space */
  .logo-text {
    display: none;
  }

  .wip-text {
    display: none;
  }

  .wip {
    font-size: 1.2rem; /* Keeps just the warning icon */
  }

  .header-center {
    margin: 0 6px;
    flex: 1;
  }

  .yt-search-input {
    font-size: 14px;
  }

  .yt-search-btn {
    padding: 0 10px;
  }

  /* YouTube Mobile-style edge-to-edge video layout */
  .yt-content-feed {
    padding: 0 0 20px 0;
  }

  .thumbnail-container {
    border-radius: 0; /* Edge to edge thumbnails on phones */
  }

  .yt-video-details {
    padding: 10px 12px 0 12px;
  }

  .avatar-channel {
    width: 32px !important;
    height: 32px !important;
  }

  .yt-video-title {
    font-size: 13.5px;
    line-height: 18px;
  }

  .yt-channel-name, 
  .yt-views-time {
    font-size: 11.5px;
  }

  .yt-video-grid {
    gap: 16px;
  }
}
</style>