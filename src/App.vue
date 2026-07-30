<template>
    <v-app >
        <v-layout >
            <v-main  >
                <v-container fluid>
                    <router-view v-slot="{ Component }">
                        <!-- Caches HomeView (and other views) in memory when you navigate away -->
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
/* body {
  background-color: #fcfcfc;
  color: black;
} */
</style>