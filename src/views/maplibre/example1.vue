<template>
  <div class="w-container grid grid-cols-24 gap-5 p-5">
    <div class="col-span-4 col-start-1 bg-orange-100 z-10 backdrop-blur-sm"></div>
    <div class="col-span-2 col-start-5 bg-green-100 h-[300px] mt-[100px] z-10 backdrop-blur-sm"></div>
    <div class="col-span-3 col-end-21 bg-green-100 h-[500px] mt-[50px] z-10 backdrop-blur-sm"></div>
    <div class="col-span-4 col-end-25 bg-blue-100 z-10 backdrop-blur-sm"></div>
    <header class="fixed left-1/2 translate-x-[-50%] top-0 w-[60vw] h-[12vh]  bg-green-200 backdrop-blur-sm z-10">test</header>
    <div class="fixed"></div>
    <div id="mapid" class="absolute w-full h-full left-0 top-0 z-9"></div>
  </div>
</template>

<script setup lang="ts">
// import '@wicv/maplibre/dist/index.css';
// import { onMounted } from 'vue'
// import { TMap } from '@wicv/maplibre';

// onMounted(() => {
//   const map = new TMap({
//     host: 'http://10.99.19.21:30827',
//     key: '29683b5e6f8140fb87b0c750741deda9',
//     container: 'mapid',
//     center: [106.2948988, 29.519401],
//     zoom: 15,
//   })
//   map.on('layers-loaded', () => {
//     console.log('地图加载完成')
//   })

//   map.on('load', () => {
//     map.addLayer({
//       id: 'hd_lane_layer',
//       type: 'line',
//       'source-layer': 'gis_hd_business.lane_relation',
//       source: {
//         type: 'vector',
//         tiles: ['http://10.99.19.21:30827/gis/open/hd/layer/tile?type=mvt&tableName=lane_relation&zoom={z}&x={x}&y={y}'],
//       },
//       paint: {
//         'line-color': 'rgba(178, 178, 178, 1)',
//         'line-width': 3,
//       },
//       minzoom: 7,
//       maxzoom: 14,
//     })
//   })
// })
</script>

<style lang="scss" scoped>
.w-container {
  height: 100vh;
  width: 100vw;
  background-color: #eee;
}
</style>