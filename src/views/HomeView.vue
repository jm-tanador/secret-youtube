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

            <div class="header-right">
                <!-- Logged in state: Show Avatar & Logout -->
                <div v-if="user" class="user-profile-menu">
                    <v-avatar size="32">
                        <img :src="user.avatar" :alt="user.name" class="user-avatar" />
                    </v-avatar>
                    <span class="user-name">{{ user.name }}</span>
                    <button @click="logout" class="auth-btn logout-btn">Sign out</button>
                </div>

                <!-- Logged out state: Sign in with Google -->
                <a 
                    v-else 
                    :href="`https://backend-93t8.onrender.com/api/auth/google`" 
                    class="auth-btn login-btn"
                >
                    <v-icon icon="mdi-account-circle" class="mr-1"></v-icon> Sign in
                </a>
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
                        <!-- In HomeView.vue inside .yt-video-card -->

                        <div class="thumbnail-container">
                            <img 
                                :src="video.snippet?.thumbnails?.medium?.url || video.snippet?.thumbnails?.default?.url" 
                                alt="thumbnail" 
                                class="yt-thumbnail" 
                            />
                            
                            <!-- LIVE BADGE (If currently live) -->
                            <span 
                                v-if="isLive(video)" 
                                class="live-badge"
                            >
                                <v-icon icon="mdi-broadcast" size="12" class="mr-1"></v-icon> LIVE
                            </span>

                            <!-- DURATION BADGE (Only if not live) -->
                            <span 
                                v-else-if="video.contentDetails?.duration && formatDuration(video.contentDetails.duration)" 
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

                                <!-- Dynamic views display: shows watching count if live, regular views if not -->
                                <p class="yt-views-time">
                                    <template v-if="isLive(video)">
                                        <span class="live-indicator-dot">●</span> 
                                        {{ formatConcurrentViewers(video.liveStreamingDetails?.concurrentViewers) }} watching
                                    </template>
                                    <template v-else>
                                        {{ formatViews(video.statistics?.viewCount) }} • {{ timeAgo(video.snippet?.publishedAt) }}
                                    </template>
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
            searchQuery: '',
            videos: [],
            loading: false,
            user: null,
            token: localStorage.getItem('auth_token') || null,
        };
    },
    methods: {
        async checkAuth() {
            // Check if Google redirected back with ?token=xxxxx
            const urlParams = new URLSearchParams(window.location.search);
            const tokenFromUrl = urlParams.get('token');

            if (tokenFromUrl) {
                this.token = tokenFromUrl;
                localStorage.setItem('auth_token', tokenFromUrl);
                window.history.replaceState({}, document.title, window.location.pathname);
            }

            if (!this.token) return;

            // Retry a few times to survive a Render cold start
            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/me`, {
                        headers: { Authorization: `Bearer ${this.token}` },
                        timeout: 60000,
                    });
                    this.user = res.data;
                    return; // success
                } catch (err) {
                    if (err.response?.status === 401) {
                        this.logout(); // token really is invalid
                        return;
                    }
                    console.warn(`Auth check failed (attempt ${attempt}), keeping login`, err);
                    await new Promise(r => setTimeout(r, 3000));
                }
            }
            // Server still unreachable: keep the token, stay logged out for this visit only
        },

        async loadVideos() {
            this.loading = true;
            try {
                // If logged in, fetch personalized feed; otherwise normal search
                if (this.user && this.token) {
                    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/feed/personalized`, {
                        headers: { Authorization: `Bearer ${this.token}` }
                    });
                    this.videos = response.data.items || [];
                } else {
                    await this.searchVideos();
                }
            } catch (error) {
                console.error("Feed error:", error);
                await this.searchVideos();
            } finally {
                this.loading = false;
            }
        },

        logout() {
            localStorage.removeItem('auth_token');
            this.token = null;
            this.user = null;
            this.searchVideos();
        },
        async searchVideos() {
            const q = this.searchQuery || 'trending';
            this.loading = true;

            if (this.searchQuery) {
                this.$router.push({ query: { search_query: this.searchQuery } });
            }

            try {
                const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/search`, {
                    params: { q }
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
            this.searchQuery = '';
            this.searchVideos();
        },
        decodeHtml(html) {
            const txt = document.createElement("textarea");
            txt.innerHTML = html;
            return txt.value;
        },
        // Check if the item is currently live
        isLive(video) {
            return video.snippet?.liveBroadcastContent === 'live';
        },

        // Format concurrent viewers (e.g., "12.4K watching")
        formatConcurrentViewers(viewers) {
            if (!viewers) return 'LIVE';
            const num = Number(viewers);
            if (isNaN(num)) return 'LIVE';

            if (num >= 1_000_000) {
                return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
            }
            if (num >= 1_000) {
                return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
            }
            return num.toLocaleString();
        },
        formatDuration(isoDuration) {
            if (!isoDuration || isoDuration === 'P0D') return '';
            
            const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (!match) return '';

            const hours = parseInt(match[1] || 0, 10);
            const minutes = parseInt(match[2] || 0, 10);
            const seconds = parseInt(match[3] || 0, 10);

            if (hours === 0 && minutes === 0 && seconds === 0) return '';

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
        },

    },
    async mounted() {
        await this.checkAuth();

        const queryParam = this.$route.query.search_query;
        if (queryParam) {
            this.searchQuery = queryParam;
            this.searchVideos();
        } else {
            this.loadVideos();
        }
    }
};
</script>

<style scoped>
.user-profile-menu {
    display: flex;
    align-items: center;
    gap: 8px;
}

.user-avatar {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
}

.user-name {
    font-size: 13px;
    max-width: 90px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.auth-btn {
    display: flex;
    align-items: center;
    padding: 6px 14px;
    border-radius: 18px;
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s ease;
}

.login-btn {
    color: #3ea6ff;
    border: 1px solid #3ea6ff;
    background: transparent;
}

.login-btn:hover {
    background: rgba(62, 166, 255, 0.15);
}

.logout-btn {
    color: #f1f1f1;
    background: #272727;
    border: 1px solid #3f3f3f;
}

.logout-btn:hover {
    background: #3f3f3f;
}
/* Live badge styling */
.live-badge {
    position: absolute;
    bottom: 8px;
    right: 8px;
    background-color: #cc0000;
    color: #ffffff;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    user-select: none;
}

.live-indicator-dot {
    color: #cc0000;
    font-size: 10px;
    vertical-align: middle;
    margin-right: 2px;
}
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