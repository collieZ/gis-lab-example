<template>
  <div class="marker">
    <div class="circle">
    </div>
    <div class="arrow"></div>
  </div>
</template>

<script setup lang="ts">

</script>

<style scoped>
.marker {
  position: relative;
}

.circle {
  width: 18px;
  height: 18px;
  background-color: #66ccff;
  border-radius: 50%;
  border: 1px solid #e49311;
}

.arrow {
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 16px solid #efd40c;
  position: absolute;
  bottom: -9px;
  left: 50%;
  transform: translateX(-50%);
}
</style>