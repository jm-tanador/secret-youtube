<template>
  <div class="watch-container">
      <button @click="$router.back()" class="back-button">← Back</button>
      <button @click="toggleFloat" class="float-toggle-btn">
          {{ isFloating ? '✕ Dock Video' : '⚡ Float Video' }}
      </button>
      
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

          <!-- Cover overlay used when dragging so the mouse doesn't get trapped by the iframe -->
          <div v-if="isDragging" class="drag-overlay"></div>

          <iframe
              :src="`https://www.youtube-nocookie.com/embed/${videoId}`"
              frameborder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
              class="iframe-player"
          ></iframe>
      </div>

      <!-- Main Video Details -->
      <div v-if="videoDetails" class="details-section">
          <h1 class="title">{{ videoDetails.snippet.title }}</h1>
          <p class="channel">{{ videoDetails.snippet.channelTitle }}</p>
          <p class="description">{{ videoDetails.snippet.description }}</p>
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
                  </div>
              </div>
          </div>

          <div v-else class="no-videos">
              No related videos found.
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
      floatHeight: 140
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
        // Use channel title as search query to get related videos from backend /search endpoint
        const searchQuery = this.videoDetails?.snippet?.channelTitle || 'trending';

        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/search`, {
          params: {
            q: searchQuery
          }
        });

        const items = response.data.items || [];
        
        // Filter out the currently playing video from suggestions
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
      if (typeof video.id === 'object') return video.id.videoId;
      return video.id;
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
        this.position.x = window.innerWidth - this.floatWidth - 20;
        this.position.y = window.innerHeight - this.floatHeight - 20;
      }
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
.watch-container { 
  padding: 20px; 
  max-width: 900px; 
  margin: 0 auto; 
  font-family: sans-serif; 
  color: #f1f1f1;
}

.back-button, .float-toggle-btn { 
  padding: 8px 16px; 
  margin-bottom: 15px; 
  cursor: pointer; 
  background-color: #272727;
  color: #f1f1f1;
  border: 1px solid #3f3f3f;
  border-radius: 18px;
  font-size: 14px;
  transition: background-color 0.2s ease;
  margin-right: 10px;
}

.back-button:hover, .float-toggle-btn:hover {
  background-color: #3f3f3f;
}

/* Resizable Player Container */
.player-wrapper { 
  position: relative; 
  width: 100%; 
  height: 500px; 
  max-width: 100%;
  min-width: 320px;
  min-height: 180px;
  max-height: 80vh;

  resize: both; 
  overflow: hidden; 
  
  background: #000; 
  border-radius: 12px;
  border: 1px solid #3f3f3f;
}

/* Floating styling modifications */
.player-wrapper.is-floating {
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  display: flex;
  flex-direction: column;
}

.drag-handle {
  background-color: #272727;
  color: #f1f1f1;
  padding: 6px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  font-size: 12px;
  user-select: none;
  border-bottom: 1px solid #3f3f3f;
}

.close-float-btn {
  background: none;
  border: none;
  color: #aaaaaa;
  cursor: pointer;
  font-size: 12px;
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

.details-section { 
  margin-top: 20px; 
  margin-bottom: 30px;
}

.title { 
  font-size: 20px; 
  margin-bottom: 5px; 
  color: #f1f1f1;
}

.channel { 
  font-size: 14px; 
  color: #aaaaaa; 
  margin-bottom: 15px; 
}

.description { 
  font-size: 14px; 
  line-height: 1.5; 
  white-space: pre-line; 
  background: #272727; 
  color: #e5e5e5;
  padding: 15px; 
  border-radius: 8px; 
}

/* RELATED VIDEOS STYLES */
.related-section {
  border-top: 1px solid #3f3f3f;
  padding-top: 20px;
  margin-top: 20px;
}

.related-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #f1f1f1;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.related-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s ease, background-color 0.2s ease;
  padding: 8px;
  background-color: transparent;
}

.related-card:hover {
  background-color: #272727;
  transform: translateY(-2px);
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
}

.video-title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.3;
  margin: 0 0 6px 0;
  color: #f1f1f1;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-channel {
  font-size: 12px;
  color: #aaaaaa;
  margin: 0;
}

.loading-state, .no-videos {
  color: #aaaaaa;
  font-size: 14px;
  padding: 20px 0;
}
</style>