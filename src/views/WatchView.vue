<template>
  <div class="watch-container">
      <div class="top-nav-actions">
          <button @click="$router.back()" class="back-button">← Back</button>
          <button @click="toggleFloat" class="float-toggle-btn">
              {{ isFloating ? '✕ Dock Video' : '⚡ Float Video' }}
          </button>
      </div>
      
      <!-- The player wrapper handles drag events when isFloating is active -->
      <div 
          class="player-wrapper" 
          :class="{ 'is-floating': isFloating }"
          :style="floatingStyle"
          @mousedown="onMouseDown"
      >
          <!-- Drag Handle Bar (only visible when floating) -->
          <div v-if="isFloating" class="drag-handle">
              <span class="handle-title">Drag to move</span>
              <button @click.stop="toggleFloat" class="close-float-btn">✕ Dock</button>
          </div>

          <!-- Cover overlay used when dragging -->
          <div v-if="isDragging" class="drag-overlay"></div>

          <!-- Embedded Video Player -->
          <!-- <iframe
              :src="`https://www.youtube-nocookie.com/embed/${videoId}`"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              class="iframe-player"
          ></iframe> -->
          <iframe
              :src="`https://www.youtube-nocookie.com/embed/${videoId}`"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
        
        <!-- If live, show current watching count -->
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
      isFloating: false,
      isDragging: false,
      position: { x: 0, y: 0 },
      dragStart: { x: 0, y: 0 },
      floatWidth: 280,
      floatHeight: 158
    };
  },
  computed: {
    floatingStyle() {
      if (!this.isFloating) return {};
      return {
        position: 'fixed',
        left: `${this.position.x}px`,
        top: `${this.position.y}px`,
        width: `${this.floatWidth}px`,
        height: `${this.floatHeight}px`,
        zIndex: '9999'
      };
    },
    isLive() {
        return this.videoDetails?.snippet?.liveBroadcastContent === 'live';
    },
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
  methods: {
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
      if (this.isFloating) {
        this.isFloating = false;
      }
      this.$router.push(`/watch/${id}`);
    },
    toggleFloat() {
      this.isFloating = !this.isFloating;
      if (this.isFloating) {
        // Adapt float dimensions on smaller screens
        if (window.innerWidth < 600) {
          this.floatWidth = 200;
          this.floatHeight = 112;
        } else {
          this.floatWidth = 280;
          this.floatHeight = 158;
        }
        this.position.x = window.innerWidth - this.floatWidth - 16;
        this.position.y = window.innerHeight - this.floatHeight - 16;
      }
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
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
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
    },
    onMouseDown(e) {
      if (!this.isFloating) return;
      if (e.target.closest('.close-float-btn')) return;

      this.isDragging = true;
      this.dragStart.x = e.clientX - this.position.x;
      this.dragStart.y = e.clientY - this.position.y;

      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
    },
    onMouseMove(e) {
      if (!this.isDragging) return;

      const newX = e.clientX - this.dragStart.x;
      const newY = e.clientY - this.dragStart.y;
      const padding = 10;

      this.position.x = Math.max(padding, Math.min(window.innerWidth - this.floatWidth - padding, newX));
      this.position.y = Math.max(padding, Math.min(window.innerHeight - this.floatHeight - padding, newY));
    },
    onMouseUp() {
      this.isDragging = false;
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('mouseup', this.onMouseUp);
    }
  },
  beforeUnmount() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
  }
};
</script>

<style scoped>
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

.back-button, .float-toggle-btn { 
  padding: 8px 16px; 
  cursor: pointer; 
  background-color: #272727;
  color: #f1f1f1;
  border: 1px solid #3f3f3f;
  border-radius: 18px;
  font-size: 13px;
  font-weight: 500;
  transition: background-color 0.2s ease;
}

.back-button:hover, .float-toggle-btn:hover {
  background-color: #3f3f3f;
}

/* Fluid, Aspect Ratio-based Player */
.player-wrapper { 
  position: relative; 
  width: 100%; 
  aspect-ratio: 16 / 9;
  background: #000; 
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #272727;
}

.player-wrapper.is-floating {
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.7);
  display: flex;
  flex-direction: column;
  aspect-ratio: unset; /* allows custom drag sizes */
}

.drag-handle {
  background-color: #272727;
  color: #f1f1f1;
  padding: 4px 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  font-size: 11px;
  user-select: none;
  border-bottom: 1px solid #3f3f3f;
}

.close-float-btn {
  background: none;
  border: none;
  color: #aaaaaa;
  cursor: pointer;
  font-size: 11px;
}

.close-float-btn:hover {
  color: #ffffff;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  background: transparent;
}

.iframe-player { 
  width: 100%; 
  height: 100%; 
  border: none;
  display: block;
  flex: 1;
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
  min-width: 0; /* Prevents overflow in flex */
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

/* ==========================================================================
   RESPONSIVE MEDIA QUERIES
   ========================================================================== */

/* Tablets and below (max-width: 768px) */
@media (max-width: 768px) {
  .watch-container {
    padding: 12px;
  }

  /* Switch related videos to YouTube-style horizontal rows */
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
}

/* Mobile Screens (max-width: 480px) */
@media (max-width: 480px) {
  .watch-container {
    padding: 0 0 24px 0; /* Edge to edge video container */
  }

  .top-nav-actions {
    padding: 8px 12px;
    margin-bottom: 0;
  }

  .back-button, .float-toggle-btn {
    font-size: 12px;
    padding: 6px 12px;
  }

  /* Full-bleed edge-to-edge player on phone screens */
  .player-wrapper {
    border-radius: 0;
    border-left: none;
    border-right: none;
  }

  /* Restore comfortable padding for content underneath the player */
  .content-wrapper {
    padding: 0 12px;
  }

  .title {
    font-size: 16px;
    margin-top: 8px;
  }

  .video-meta-bar {
    font-size: 12px;
    gap: 4px;
  }

  .description {
    font-size: 12.5px;
    padding: 10px 12px;
  }

  .thumbnail-wrapper {
    width: 120px;
    min-width: 120px;
  }

  .video-title {
    font-size: 12.5px;
    line-height: 1.25;
  }

  .video-channel,
  .video-views-date {
    font-size: 11px;
  }
}
</style>