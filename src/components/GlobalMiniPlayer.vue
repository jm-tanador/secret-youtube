<template>
  <div 
    v-if="playerStore.currentVideoId && playerStore.isMiniPlayer" 
    class="global-mini-player"
  >
    <div class="mini-player-header">
      <span class="mini-title">{{ playerStore.videoDetails?.snippet?.title || 'Playing Video' }}</span>
      <div class="mini-controls">
        <button @click="expandPlayer" title="Expand">⤢</button>
        <button @click="closePlayer" title="Close">✕</button>
      </div>
    </div>
    <div class="mini-iframe-wrapper">
      <iframe
        :src="`https://www.youtube-nocookie.com/embed/${playerStore.currentVideoId}?autoplay=1`"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        class="mini-iframe"
      ></iframe>
    </div>
  </div>
</template>

<script>
import { playerStore } from '../playerStore';

export default {
  data() {
    return {
      playerStore
    };
  },
  methods: {
    expandPlayer() {
      const id = playerStore.currentVideoId;
      playerStore.restore();
      this.$router.push(`/watch/${id}`);
    },
    closePlayer() {
      playerStore.close();
    }
  }
};
</script>

<style scoped>
.global-mini-player {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 360px;
  height: 240px;
  background-color: #0f0f0f;
  border: 1px solid #303030;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.8);
  z-index: 99999;
  display: flex;
  flex-direction: column;
}

.mini-player-header {
  height: 36px;
  background-color: #1f1f1f;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px;
  border-bottom: 1px solid #303030;
}

.mini-title {
  color: #fff;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 250px;
}

.mini-controls button {
  background: transparent;
  border: none;
  color: #aaa;
  cursor: pointer;
  font-size: 14px;
  margin-left: 8px;
}

.mini-controls button:hover {
  color: #fff;
}

.mini-iframe-wrapper {
  flex: 1;
  position: relative;
  background: #000;
}

.mini-iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>