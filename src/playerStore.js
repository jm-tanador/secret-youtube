import { reactive } from 'vue';

export const playerStore = reactive({
  currentVideoId: null,
  isMiniPlayer: false,
  videoDetails: null,

  setVideo(videoId, details = null) {
    this.currentVideoId = videoId;
    this.videoDetails = details;
    this.isMiniPlayer = false;
  },

  minimize() {
    this.isMiniPlayer = true;
  },

  restore() {
    this.isMiniPlayer = false;
  },

  close() {
    this.currentVideoId = null;
    this.isMiniPlayer = false;
    this.videoDetails = null;
  }
});