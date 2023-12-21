<template>
   <div id="mapid" style="width: 100vw; height: 100vh"></div>
</template>

<script setup lang="ts">
// import '@wicv/maplibre/dist/index.css';
// import { onMounted } from 'vue'
// import { TMap } from '@wicv/maplibre';

// onMounted(() => {
//   const map = new TMap({
//         host: 'http://10.99.19.21:30827',
//         key: '29683b5e6f8140fb87b0c750741deda9',
//         container: 'mapid',
//         center: [106.2948988, 29.519401],
//         zoom: 15,
//     })
//     map.on('layers-loaded', () => {
//         console.log('地图加载完成')
//     })

//     map.on('load', () => {
//         map.addLayer({
//             id: 'hd_lane_layer',
//             type: 'line',
//             'source-layer': 'gis_hd_business.lane_relation',
//             source: {
//                 type: 'vector',
//                 tiles: ['http://10.99.19.21:30827/gis/open/hd/layer/tile?type=mvt&tableName=lane_relation&zoom={z}&x={x}&y={y}'],
//             },
//             paint: {
//                 'line-color': 'rgba(178, 178, 178, 1)',
//                 'line-width': 3,
//             },
//             minzoom: 7,
//             maxzoom: 14,
//         })
//     })
// })
</script>

<style scoped>
#wicvmapContainer {
    height: 100vh;
    width: 100vw;
}
</style>