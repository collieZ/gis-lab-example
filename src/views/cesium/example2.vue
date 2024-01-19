<template>
  <div id="mars3dContainer" class="mars3d-container"></div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
//引入cesium基础库
// import "mars3d-cesium/Build/Cesium/Widgets/widgets.css";
// import * as Cesium from "mars3d-cesium";

//导入mars3d主库
import "mars3d/dist/mars3d.css";
import * as mars3d from "mars3d";

onMounted(() => {
  var mapOptions = {
    basemaps: [{ name: "天地图", type: "tdt", layer: "img_d", show: true }],
    scene: {
      showSkyBox: true, //是否显示天空盒
      fog: true, //是否启用雾化效果
      fxaa: true, //是否启用抗锯齿
      center: { "lat": 38.935573, "lng": 103.622661, "alt": 452.4, "heading": 4.5, "pitch": -18.5 }
    }
  };
  var map = new mars3d.Map("mars3dContainer", mapOptions);
})
</script>

<style scoped></style>