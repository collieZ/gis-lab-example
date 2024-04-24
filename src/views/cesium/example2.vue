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
  // 相关事件绑定
  map.on(mars3d.EventType.click, (e) => {
    console.log(e, 'click');
  })
  map.on(mars3d.EventType.preUpdate, () => {
    console.log('preUpdate');
  })

  let geoJsonLayer = new mars3d.layer.GeoJsonLayer({
  name: '省界线',
  url: 'http://data.mars3d.cn/file/geojson/sheng-line.json',
  symbol: {//可以通过配置symbol参数来指定渲染的矢量数据类型和样式。
    type:"polyline",
    styleOptions: {
      color: '#66ccff',
      opacity: 0.8,
      width: 2
    },
  },
})
map.addLayer(geoJsonLayer)

  //创建矢量数据图层
let graphicLayer = new mars3d.layer.GraphicLayer()
map.addLayer(graphicLayer)

//加载数据到矢量图层
let graphic = new mars3d.graphic.LabelEntity({
  position: new mars3d.LngLatPoint(116.1, 31.0, 1000),
  style: {
    text: 'Mars3D三维可视化平台',
    font_size: 25,
    color: '#003da6',
    highlight: {
      type:mars3d.EventType.mouseOver, //默认为鼠标移入，也可以加该参数后单击高亮
      opacity: 0.9,
      color: '#ffffff'
    },
  },
  flyTo: true
})
graphicLayer.addGraphic(graphic)
})
</script>

<style scoped></style>