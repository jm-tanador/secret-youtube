<template>
    <!-- Add theme="dark" to apply Vuetify's global dark theme -->
    <v-app theme="dark">
        <v-layout>
            <v-main>
                <!-- Use class="pa-0" to remove default container padding -->
                <v-container fluid class="pa-0">
                    <router-view v-slot="{ Component }">
                        <!-- Caches HomeView in memory when you navigate away -->
                        <keep-alive>
                            <component :is="Component" :key="$route.path" />
                        </keep-alive>
                    </router-view>
                </v-container>
            </v-main>
        </v-layout>
    </v-app>
</template>

<style>
/* Reset base background for the browser viewport */
html, body {
  background-color: #0f0f0f !important;
  margin: 0;
} 
</style>