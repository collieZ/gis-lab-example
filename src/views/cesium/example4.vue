<template>
  <div id="mars3dContainer" class="mars3d-container"></div>
  <NButton @click="play">播放</NButton>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { NButton } from 'naive-ui'
//引入cesium基础库
// import "mars3d-cesium/Build/Cesium/Widgets/widgets.css";
import * as Cesium from "mars3d-cesium";

//导入mars3d主库
import "mars3d/dist/mars3d.css";
import * as mars3d from "mars3d";
const viewsList = [
  { "lat": 29.607111, "lng": 106.307765, "alt": 30.7, "heading": 279, "pitch": -8.4, roll: 0, duration: 0, stop: 0 },
  { "lat": 29.607197, "lng": 106.296579, "alt": 30.7, "heading": 279, "pitch": -8.4, roll: 0, duration: 20 }
]

let mapEntity;
onMounted(() => {
  var mapOptions = {
    basemaps: [{ name: "天地图", type: "tdt", layer: "img_d", show: true }],
    // terrain: {
    //   url: "http://data.mars3d.cn/terrain",
    //   show: true
    // },
    scene: {
      showSkyBox: true, //是否显示天空盒
      fog: true, //是否启用雾化效果
      fxaa: true, //是否启用抗锯齿
      center: { "lat": 29.607111, "lng": 106.307765, "alt": 30.7, "heading": 279, "pitch": -8.4 }
    }
  };
  var map = new mars3d.Map("mars3dContainer", mapOptions);
  mapEntity = map
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
      type: "polyline",
      styleOptions: {
        color: '#66ccff',
        opacity: 0.8,
        width: 2
      },
    },
  })
  // map.addLayer(geoJsonLayer)

  const initPathProperty = () => {
    let start, stop;
    const property = new Cesium.SampledPositionProperty()
    property.forwardExtrapolationType = Cesium.ExtrapolationType.HOLD
    const linePos = [
      [106.307765, 29.607111, 30.7],
      [106.296579, 29.607197, 30.7]
    ]
    linePos.forEach((item, index) => {
      let time = Cesium.JulianDate.fromDate(new Date('2017-08-25 08:00:00'))
      if (index === 1) {
        time = Cesium.JulianDate.fromDate(new Date('2017-08-25 08:00:20'))
      }
      const position = Cesium.Cartesian3.fromDegrees(item[0], item[1], item[2])
      property.addSample(time, position)

      if (index === 0) {
        start = time
      } else if (index === linePos.length - 1) {
        stop = time
      }
    })

    map.clock.startTime = start.clone()
    map.clock.stopTime = stop.clone()
    map.clock.currentTime = start.clone()
    map.clock.clockRange = Cesium.ClockRange.LOOP_STOP
    map.clock.multiplier = 1
    return property
  }

  //创建矢量数据图层
  let graphicLayer = new mars3d.layer.GraphicLayer()
  map.addLayer(graphicLayer)
  const property = initPathProperty()
  property.setInterpolationOptions({
    interpolationDegree: 5,
    interpolationAlgorithm: Cesium.LagrangePolynomialApproximation
  });
  //加载数据到矢量图层
  let graphic = new mars3d.graphic.BoxEntity({
    // position: new mars3d.LngLatPoint(116.1, 31.0, 1000),
    position: property,
    style: {
      dimensions: new Cesium.Cartesian3(10.0, 10.0, 10.0),
      fill: true,
      color: "#00ff00",
      opacity: 0.4
    },
    // flyTo: true
  })
  graphicLayer.addGraphic(graphic)
  // setInterval(() => {
  //   map.flyToGraphic(graphic, {
  //     radius: 800, // 距离目标点的距离
  //     heading: 40,
  //     pitch: -50,
  //     duration: 0.1,
  //   })
  // }, 60)
  // setTimeout(() => {
  //   console.log(graphic.entity);
  //   map.trackedEntity = graphic.entity
  // }, 500);
  // console.log(graphic, graphic.flyTo);
})

const play = () => {
  // debugger
  mapEntity.setCameraViewList(viewsList, {
    maximumHeight: 30.7
  })
}
</script>

<style scoped></style>