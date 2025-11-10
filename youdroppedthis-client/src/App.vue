<template>
  <main>
    <router-view />
    <ToastContainer />
  </main>
</template>

<script setup lang="ts">
import ToastContainer from './components/Layout/ToastContainer.vue'
</script>
