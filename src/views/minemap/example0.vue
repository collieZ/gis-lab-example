<template>
  <div id="map-0"></div>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue';
import { onMounted } from 'vue';

import Marker from '@/components/Marker.vue';
import { createVNode } from 'vue';
import { render } from 'vue';

window.minemap.domainUrl = "https://minemap.minedata.cn"; /* MineMap根域名地址 */
window.minemap.dataDomainUrl = "https://minemap.minedata.cn"; /* MineMap矢量数据服务根域名地址 */
window.minemap.serverDomainUrl = "https://sd-data.minedata.cn"; /* MineMap矢量数据服务新规范根域名地址 */
window.minemap.spriteUrl = "https://minemap.minedata.cn/minemapapi/v2.1.1/sprite/sprite"; /* MineMap底图雪碧图地址 */
window.minemap.serviceUrl = "https://service.minedata.cn/service"; /* MineMap后台服务根地址 */
window.minemap.key = "71fa5f9529194e03ab10a87724eddd2a";
window.minemap.solution = 1079785103332794368;

onMounted(() => {
  const map = new window.minemap.Map({
    container: "map-0",
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

  /** popup */
  let popup = new window.minemap.Popup({ closeOnClick: true, closeButton: true,  offset: [10, -20] })
    // .setLngLat([106.326528, 29.516402])
    .setHTML("<h1 class='popup'>我是一个信息窗体</h1>")
  // .trackPointer() //此方法可以让popup跟随鼠标指针，使用此方法就不再需要使用setLngLat()方法
  // .addTo(map);

  /** marker */
  const markerEl = document.createElement('div')
  const markerEl2 = document.createElement('div')
  const markerVNode = createVNode(Marker, {})
  render(markerVNode, markerEl)
  render(markerVNode, markerEl2)
  // Marker构造函数接收两个参数，一个为自定义的DOM元素，一个是Object参数，其中包括偏移量等
  // offset参数为标注点相对于其左上角偏移像素大小
  // 调用setLngLat方法指定Marker的坐标位置
  let marker1 = new window.minemap.Marker(markerEl, { offset: [0, -30] }).setLngLat([106.27296965039051, 29.494085566391078]).setPopup(popup).addTo(map);
  let marker2 = new window.minemap.Marker(markerEl2, { offset: [-20, 0], draggable: true }).setLngLat([106.38008634960931, 29.538713513631407]).addTo(map);
  console.log(marker1, marker2);

  /** control */
  map.addControl(new window.minemap.Navigation(), "bottom-right");
  map.addControl(new window.minemap.Scale(), "top-right");
  map.addControl(new window.minemap.Fullscreen(), "top-right");
  console.log(map, map.getBounds());


  map.setZoom(14);
  map.on("load", () => {
    // 地图资源加载完成后触发
    // 增加自定义数据源、自定义图层
    // getBearing 倾斜角度 以北为正方向，逆时针递增
    // setPitch 俯仰角 0-60 向上为正向
    console.log('地图及资源加载完成～～～', map.getBearing(), map.getPitch());
    // map.setPitch(60)
  });
  onUnmounted(() => {
    map.remove();
    popup.remove()
    popup = null
    marker1.remove()
    marker2.remove()
    marker1 = null
    marker2 = null
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
#map-0 {
  width: 100%;
  height: 90vh;
}

:deep(.popup) {
  color: blueviolet;
}
</style>