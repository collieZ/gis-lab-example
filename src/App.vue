<script setup lang="ts">
import { RouterView } from 'vue-router';
import { NConfigProvider, darkTheme, lightTheme } from 'naive-ui'
lightTheme;
</script>

<template>
  <NConfigProvider :theme="darkTheme">
    <RouterView></RouterView>
  </NConfigProvider>
</template>
