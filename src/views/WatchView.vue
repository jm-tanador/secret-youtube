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
      videoDetails: null,
      isFloating: false,
      isDragging: false,
      // Default offset from the bottom-right corner when first floated
      position: { x: 20, y: 20 },
      dragStart: { x: 0, y: 0 }
    };
  },
  computed: {
    floatingStyle() {
      if (!this.isFloating) return {};
      return {
        position: 'fixed',
        bottom: `${this.position.y}px`,
        right: `${this.position.x}px`,
        width: '380px',
        height: '240px',
        zIndex: '9999',
        resize: 'none' // Disable standard resize to prevent dragging conflicts
      };
    }
  },
  methods: {
    toggleFloat() {
      this.isFloating = !this.isFloating;
      if (this.isFloating) {
        // Reset to initial bottom-right corner coordinates on float
        this.position = { x: 20, y: 20 };
      }
    },
    onMouseDown(e) {
      if (!this.isFloating) return;
      // Do not trigger drag if clicking the dock/close button
      if (e.target.closest('.close-float-btn')) return;

      this.isDragging = true;
      
      // Calculate coordinates relative to screen boundaries
      this.dragStart.x = e.clientX + this.position.x;
      this.dragStart.y = e.clientY + this.position.y;

      window.addEventListener('mousemove', this.onMouseMove);
      window.addEventListener('mouseup', this.onMouseUp);
    },
    onMouseMove(e) {
      if (!this.isDragging) return;

      this.position.x = this.dragStart.x - e.clientX;
      this.position.y = this.dragStart.y - e.clientY;

      // Keep inside visible screen boundaries
      const padding = 10;
      this.position.x = Math.max(padding, Math.min(window.innerWidth - 390, this.position.x));
      this.position.y = Math.max(padding, Math.min(window.innerHeight - 250, this.position.y));
    },
    onMouseUp() {
      this.isDragging = false;
      window.removeEventListener('mousemove', this.onMouseMove);
      window.removeEventListener('mouseup', this.onMouseUp);
    }
  },
  beforeUnmount() {
    // Ensure event cleanups occur if navigating away while dragging
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
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

/* Resizable Player Container (Default inline state) */
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

/* Header bar for dragging handle */
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

/* Overlay covering the iframe during drags */
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
</style>