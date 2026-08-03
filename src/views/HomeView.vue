<template>
    <div class="yt-app-layout">
        <!-- 1. YouTube Header Navigation -->
        <header class="yt-header">
            <div class="header-left">
                <v-btn icon="mdi-menu" variant="text" class="menu-btn"></v-btn>
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
                        <v-icon icon="mdi-magnify" size="large"></v-icon>
                    </button>
                </div>
                <v-btn icon="mdi-microphone" variant="flat" class="mic-btn ml-2" size="40"></v-btn>
            </div>

            <div class="header-right">
                <v-btn icon="mdi-video-plus-outline" variant="text" class="d-none d-sm-inline-flex"></v-btn>
                <v-btn icon="mdi-bell-outline" variant="text" class="d-none d-sm-inline-flex"></v-btn>
                <v-avatar color="red-darken-1" size="32" class="ml-2 text-white">
                    <span class="text-caption font-weight-bold">Y</span>
                </v-avatar>
            </div>
        </header>

        <div class="main-body">
        <!-- 2. Left Sidebar -->
        <aside class="yt-sidebar d-none d-md-block">
            <div class="sidebar-item active">
                <v-icon icon="mdi-home" class="mr-6"></v-icon>
                <span>Home</span>
            </div>
            <div class="sidebar-item">
                <v-icon icon="mdi-play-circle-outline" class="mr-6"></v-icon>
                <span>Shorts</span>
            </div>
            <div class="sidebar-item">
                <v-icon icon="mdi-youtube-subscription" class="mr-6"></v-icon>
                <span>Subscriptions</span>
            </div>
            <hr class="sidebar-divider" />
            <div class="sidebar-item">
                <v-icon icon="mdi-folder-play-outline" class="mr-6"></v-icon>
                <span>Library</span>
            </div>
            <div class="sidebar-item">
                <v-icon icon="mdi-history" class="mr-6"></v-icon>
                <span>History</span>
            </div>
        </aside>

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
                    :key="video.id.videoId" 
                    class="yt-video-card"
                    @click="playVideo(video.id.videoId)"
                >
                    <div class="thumbnail-container">
                        <img :src="video.snippet.thumbnails.medium.url" alt="thumbnail" class="yt-thumbnail" />
                    </div>
                    
                    <div class="yt-video-details">
                        <!-- Swapped to grey-darken-3 for dark mode compatibility -->
                        <v-avatar color="grey-darken-3" size="36" class="mr-3 mt-1 text-white">
                            <span class="text-caption text-uppercase font-weight-bold">
                                {{ video.snippet.channelTitle.charAt(0) }}
                            </span>
                        </v-avatar>
                        <div class="details-metadata">
                            <h3 class="yt-video-title">{{ decodeHtml(video.snippet.title) }}</h3>
                            <p class="yt-channel-name">{{ video.snippet.channelTitle }}</p>
                            <p class="yt-views-time">1.2M views • 2 days ago</p>
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
        playVideo(videoId) {
            this.$router.push({ name: 'watch', params: { id: videoId } });
        },
        resetToHome() {
            this.searchQuery = 'trending';
            this.searchVideos();
        },
        decodeHtml(html) {
            const txt = document.createElement("textarea");
            txt.innerHTML = html;
            return txt.value;
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
/* App Layout Container */
.yt-app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #0f0f0f;
  color: #f1f1f1;
  font-family: Roboto, Arial, sans-serif;
}

/* 1. Header Styles */
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
}

.menu-btn {
  margin-right: 4px;
}

.logo-container {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.logo-icon {
  font-size: 28px !important;
  color: #ff0000; /* Standard red icon colors */
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
  flex: 0 1 728px;
  margin: 0 16px;
}

.search-wrapper {
  display: flex;
  width: 100%;
  border: 1px solid #303030;
  border-radius: 40px 0 0 40px;
  background-color: #121212;
  overflow: hidden;
}

.yt-search-input {
  width: 100%;
  border: none;
  font-size: 16px;
  outline: none;
}

.yt-search-btn {
  background-color: #222222;
  border: none;
  border-left: 1px solid #303030;
  padding: 0 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #f1f1f1;
}

.yt-search-btn:hover {
  background-color: #272727;
}

.mic-btn {
  background-color: #1a1a1a !important;
  color: #f1f1f1 !important;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 2. Main Body with Sidebar & Content */
.main-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar Navigation */
.yt-sidebar {
  width: 240px;
  background-color: #0f0f0f;
  padding: 12px;
  box-sizing: border-box;
  overflow-y: auto;
}

.sidebar-item {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  color: #f1f1f1;
  margin-bottom: 2px;
}

.sidebar-item:hover {
  background-color: #272727;
}

.sidebar-item.active {
  background-color: #272727;
  font-weight: bold;
}

.sidebar-divider {
  border: 0;
  border-top: 1px solid #2f2f2f;
  margin: 12px 0;
}

/* Main Content Area */
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

/* Responsive CSS Grid */
.yt-video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 40px 16px;
}

/* 3. Card Styles */
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
</style>