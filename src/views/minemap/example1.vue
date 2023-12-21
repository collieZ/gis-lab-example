<template>
  <div id="map-1"></div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue';
import { onMounted } from 'vue';

window.minemap.domainUrl = "https://minemap.minedata.cn"; /* MineMap根域名地址 */
window.minemap.dataDomainUrl = "https://minemap.minedata.cn"; /* MineMap矢量数据服务根域名地址 */
window.minemap.serverDomainUrl = "https://sd-data.minedata.cn"; /* MineMap矢量数据服务新规范根域名地址 */
window.minemap.spriteUrl = "https://minemap.minedata.cn/minemapapi/v2.1.1/sprite/sprite"; /* MineMap底图雪碧图地址 */
window.minemap.serviceUrl = "https://service.minedata.cn/service"; /* MineMap后台服务根地址 */
window.minemap.key = "71fa5f9529194e03ab10a87724eddd2a";
window.minemap.solution = 1079785103332794368;

onMounted(() => {
  const map = new window.minemap.Map({
    container: "map-1",
    style: "https://service.minedata.cn/map/solu/style/11001" /* 底图样式 */,
    center: [106.326528, 29.516402] /* 地图中心点 */,
    zoom: 10 /* 地图默认缩放等级 */,
    pitch: 0 /* 地图俯仰角度 */,
    maxZoom: 17 /* 地图最大缩放等级 */,
    minZoom: 3 /* 地图最小缩放等级 */,
    logoControl: false
  });

  /** fitBounds */
  const sw = new window.minemap.LngLat(106.27296965039051, 29.494085566391078); //西南角的的坐标
  const ne = new window.minemap.LngLat(106.38008634960931, 29.538713513631407); //东北角的坐标
  const bounds = new window.minemap.LngLatBounds(sw, ne); //边界框
  map.fitBounds(bounds);


  /** control */
  map.addControl(new window.minemap.Navigation(), "bottom-right");
  map.addControl(new window.minemap.Scale(), "top-right");
  map.addControl(new window.minemap.Fullscreen(), "top-right");
  console.log(map, map.getBounds());


  map.setZoom(14);
  map.on("load", () => {
    // 地图资源加载完成后触发
    // 增加自定义数据源、自定义图层
    console.log('地图及资源加载完成～～～');
  });
  onUnmounted(() => {
    map.remove();
  })
})
</script>

<script lang="ts">
function getBounds(points: any[]) {
  var bounds = {
    minLng: points[0].lng,
    maxLng: points[0].lng,
    minLat: points[0].lat,
    maxLat: points[0].lat
  };
  for (var i = 1; i < points.length; i++) {
    var point = points[i];
    if (point.lng < bounds.minLng) {
      bounds.minLng = point.lng;
    }
    if (point.lng > bounds.maxLng) {
      bounds.maxLng = point.lng;
    }
    if (point.lat < bounds.minLat) {
      bounds.minLat = point.lat;
    }
    if (point.lat > bounds.maxLat) {
      bounds.maxLat = point.lat;
    }
  }
  return bounds;
}
getBounds
</script>

<style scoped>
#map-1 {
  width: 100%;
  height: 90vh;
}

:deep(.popup) {
  color: blueviolet;
}
</style>