<template>
  <div class="watch-container">
    <div class="top-nav-actions">
      <button @click="$router.back()" class="back-button">← Back</button>
      
      <!-- Native OS Floating Window (Cross-tab & Outside Browser) -->
      <button 
        v-if="supportsDocPiP" 
        @click="togglePictureInPicture" 
        class="pip-toggle-btn"
      >
        {{ isPipActive ? '✕ Close Floating Window' : '⧉ Float Window' }}
      </button>

      <!-- In-Page Mini Player (Within the Tab) -->
      <button @click="toggleInPageDock" class="dock-toggle-btn">
        {{ isDocked ? 'Dock Video' : 'Mini Player' }}
      </button>
    </div>
    
    <!-- Player container -->
    <div 
      ref="playerContainer"
      class="player-wrapper" 
      :class="{ 'is-docked': isDocked }"
    >
      <iframe
        ref="playerIframe"
        :src="`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        class="iframe-player"
      ></iframe>
    </div>

    <div class="content-wrapper">
      <!-- Main Video Details -->
      <div v-if="videoDetails" class="details-section">
        <h1 class="title">
          <span v-if="isLive" class="live-tag">LIVE</span>
          {{ videoDetails.snippet?.title }}
        </h1>
        
        <div class="video-meta-bar">
          <span class="channel">{{ videoDetails.snippet?.channelTitle }}</span>
          <span class="meta-separator">•</span>
          
          <span v-if="isLive" class="live-watching">
            {{ formatViews(videoDetails.liveStreamingDetails?.concurrentViewers) }} watching now
          </span>
          <span v-else class="meta-views">
            {{ formatViews(videoDetails.statistics?.viewCount) }}
          </span>

          <span class="meta-separator">•</span>
          <span class="meta-date">{{ formatDate(videoDetails.snippet?.publishedAt) }}</span>
        </div>

        <p class="description">{{ videoDetails.snippet?.description }}</p>
      </div>

      <!-- RELATED VIDEOS SECTION -->
      <div class="related-section">
        <h2 class="related-title">Related Videos</h2>
        
        <div v-if="isLoadingRelated" class="loading-state">
          Loading recommendations...
        </div>

        <div v-else-if="relatedVideos.length > 0" class="related-grid">
          <div 
            v-for="video in relatedVideos" 
            :key="getVideoId(video)" 
            class="related-card"
            @click="playVideo(getVideoId(video))"
          >
            <div class="thumbnail-wrapper">
              <img 
                :src="video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url" 
                :alt="video.snippet?.title" 
                class="thumbnail-img" 
              />
            </div>
            <div class="video-info">
              <h3 class="video-title">{{ video.snippet?.title }}</h3>
              <p class="video-channel">{{ video.snippet?.channelTitle }}</p>
              <p class="video-views-date">
                {{ formatViews(video.statistics?.viewCount) }} • {{ timeAgo(video.snippet?.publishedAt) }}
              </p>
            </div>
          </div>
        </div>

        <div v-else class="no-videos">
          No related videos found.
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
      videoId: this.$route.params.id,
      videoDetails: null,
      relatedVideos: [],
      isLoadingRelated: false,
      isDocked: false,
      isPipActive: false,
      pipWindow: null,
      supportsDocPiP: false
    };
  },
  computed: {
    isLive() {
      return this.videoDetails?.snippet?.liveBroadcastContent === 'live';
    }
  },
  watch: {
    '$route.params.id': {
      immediate: true,
      handler(newId) {
        if (newId) {
          this.videoId = newId;
          this.loadVideoData();
        }
      }
    }
  },
  mounted() {
    // Check if the browser supports Document Picture-in-Picture API
    this.supportsDocPiP = 'documentPictureInPicture' in window;
  },
  beforeUnmount() {
    this.closePip();
  },
  methods: {
    // OS-level PiP that allows you to leave the tab and use other desktop apps
    async togglePictureInPicture() {
      if (this.isPipActive) {
        this.closePip();
        return;
      }

      const iframe = this.$refs.playerIframe;
      const container = this.$refs.playerContainer;
      if (!iframe || !container) return;

      try {
        // Open standalone always-on-top desktop window
        this.pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 480,
          height: 270,
        });

        // Set basic dark mode styling on the new window
        this.pipWindow.document.body.style.margin = '0';
        this.pipWindow.document.body.style.backgroundColor = '#000';
        this.pipWindow.document.body.style.overflow = 'hidden';

        iframe.style.width = '100vw';
        iframe.style.height = '100vh';

        // Move the iframe into the OS window without reloading it
        this.pipWindow.document.body.append(iframe);
        this.isPipActive = true;

        // When user closes the PiP window, return iframe back to original spot
        this.pipWindow.addEventListener('pagehide', () => {
          iframe.style.width = '100%';
          iframe.style.height = '100%';
          container.append(iframe);
          this.isPipActive = false;
          this.pipWindow = null;
        });
      } catch (err) {
        console.error("Failed to open Document Picture-in-Picture:", err);
      }
    },

    closePip() {
      if (this.pipWindow) {
        this.pipWindow.close();
        this.pipWindow = null;
        this.isPipActive = false;
      }
    },

    // In-page mini player toggle
    toggleInPageDock() {
      this.isDocked = !this.isDocked;
    },

    async loadVideoData() {
      await this.fetchVideoDetails();
      await this.fetchRelatedVideos();
    },
    async fetchVideoDetails() {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/videos/${this.videoId}`);
        if (response.data.items && response.data.items.length > 0) {
          this.videoDetails = response.data.items[0];
        }
      } catch (error) {
        console.error("Error fetching video details:", error);
      }
    },
    async fetchRelatedVideos() {
      this.isLoadingRelated = true;
      try {
        const searchQuery = this.videoDetails?.snippet?.channelTitle || 'trending';
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/search`, {
          params: { q: searchQuery }
        });

        const items = response.data.items || [];
        this.relatedVideos = items.filter(
          item => this.getVideoId(item) !== this.videoId
        );
      } catch (error) {
        console.error("Error fetching related videos:", error);
      } finally {
        this.isLoadingRelated = false;
      }
    },
    getVideoId(video) {
      if (typeof video.id === 'object' && video.id !== null) {
        return video.id.videoId || '';
      }
      return video.id || '';
    },
    playVideo(id) {
      this.closePip();
      this.$router.push(`/watch/${id}`);
    },
    formatViews(views) {
      if (!views) return 'No views';
      const num = Number(views);
      if (isNaN(num)) return '0 views';

      if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B views';
      if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M views';
      if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K views';
      return `${num} views`;
    },
    formatDate(dateString) {
      if (!dateString) return '';
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    timeAgo(dateString) {
      if (!dateString) return '';
      const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
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
        if (count >= 1) return `${count} ${interval.label}${count > 1 ? 's' : ''} ago`;
      }
      return 'Just now';
    }
  }
};
</script>

<style scoped>
.watch-container { 
  padding: 20px; 
  max-width: 1100px; 
  margin: 0 auto; 
  font-family: Roboto, Arial, sans-serif; 
  color: #f1f1f1;
}

.top-nav-actions {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 10px;
}

.back-button, .pip-toggle-btn, .dock-toggle-btn { 
  padding: 8px 16px; 
  cursor: pointer; 
  background-color: #272727;
  color: #f1f1f1;
  border: 1px solid #3f3f3f;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.pip-toggle-btn {
  background-color: #1e3a8a;
  border-color: #3b82f6;
}

.pip-toggle-btn:hover {
  background-color: #2563eb;
}

.back-button:hover, .dock-toggle-btn:hover {
  background-color: #3f3f3f;
}

/* Player Wrapper */
.player-wrapper { 
  position: relative; 
  width: 100%; 
  aspect-ratio: 16 / 9;
  background: #000; 
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #272727;
  transition: all 0.3s ease;
}

/* In-Page Mini Player Mode */
.player-wrapper.is-docked {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 320px;
  height: 180px;
  aspect-ratio: unset;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.85);
  z-index: 9999;
}

.iframe-player { 
  width: 100%; 
  height: 100%; 
  border: none;
  display: block;
}

.content-wrapper {
  width: 100%;
}

.details-section { 
  margin-top: 16px; 
  margin-bottom: 24px;
}

.title { 
  font-size: 18px; 
  font-weight: 600;
  line-height: 1.4;
  margin-bottom: 8px; 
  color: #f1f1f1;
}

.live-tag {
  background-color: #cc0000;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 8px;
  vertical-align: middle;
}

.live-watching {
  color: #ff4e45;
  font-weight: 500;
}

.video-meta-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 13px;
  color: #aaaaaa;
  margin-bottom: 12px;
  gap: 6px;
}

.channel {
  font-weight: 500;
  color: #f1f1f1;
}

.meta-separator {
  color: #666;
}

.description { 
  font-size: 13.5px; 
  line-height: 1.5; 
  white-space: pre-line; 
  background: #212121; 
  color: #e5e5e5;
  padding: 12px 16px; 
  border-radius: 8px; 
}

.related-section {
  border-top: 1px solid #303030;
  padding-top: 20px;
  margin-top: 20px;
}

.related-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 14px;
  color: #f1f1f1;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.related-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: background-color 0.2s ease;
  padding: 6px;
}

.related-card:hover {
  background-color: #272727;
}

.thumbnail-wrapper {
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 8px;
}

.thumbnail-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.video-title {
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.3;
  margin: 0 0 4px 0;
  color: #f1f1f1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-channel,
.video-views-date {
  font-size: 12px;
  color: #aaaaaa;
  margin: 0;
}

.video-views-date {
  margin-top: 2px;
}

.loading-state, .no-videos {
  color: #aaaaaa;
  font-size: 13px;
  padding: 16px 0;
}

/* Responsive */
@media (max-width: 768px) {
  .watch-container {
    padding: 12px;
  }

  .related-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .related-card {
    flex-direction: row;
    align-items: flex-start;
    padding: 0;
    gap: 12px;
  }

  .thumbnail-wrapper {
    width: 140px;
    min-width: 140px;
    margin-bottom: 0;
    border-radius: 6px;
  }

  .video-info {
    flex: 1;
  }

  .player-wrapper.is-docked {
    width: 220px;
    height: 124px;
    bottom: 12px;
    right: 12px;
  }
}
</style>