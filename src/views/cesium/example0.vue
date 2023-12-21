<template>
  <div class="cesium-container" ref="cesiumContainer">
    <div id="credit"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  Viewer,
  UrlTemplateImageryProvider,
  viewerCesiumInspectorMixin,
  viewerCesium3DTilesInspectorMixin,
  viewerDragDropMixin,
  viewerPerformanceWatchdogMixin,
  viewerVoxelInspectorMixin,
  Cartographic,
  Math as CesiumMath,
  SkyBox,
  Cartesian3,
  Color,
  CzmlDataSource,
  HeightReference,
  IonImageryProvider,
  CesiumTerrainProvider,
  IonResource,
  Rotation,
  Cartesian2,
  BoundingSphere,
  NearFarScalar,
  DistanceDisplayCondition,
  CallbackProperty,
  JulianDate,
  GridMaterialProperty,
  StripeMaterialProperty,
  StripeOrientation,
  CheckerboardMaterialProperty,
  PolylineGlowMaterialProperty,
  HeadingPitchRange,
  HeadingPitchRoll,
  ShadowMode,
  GeoJsonDataSource,
  SampledProperty,
} from "cesium";
import CesiumNavigation from "cesium-navigation-es6";
const skyboxImgs = Object.entries(import.meta.glob(["../assets/images/[np][xyz].jpg"], { eager: true })).reduce((pre: Record<string, any>, img) => {
  pre[img[0].replace(/^(..\/assets\/images\/)/, '').replace('.jpg', '')] = (img[1] as any).default
  return pre
}, {})
console.log(skyboxImgs, 'imim');
let viewer, layer, labelLayer;
const cesiumContainer = ref();

onMounted(async () => {
  viewer = new Viewer(cesiumContainer.value, {
    geocoder: false, // 搜索
    homeButton: true, // 初始视角
    sceneModePicker: false, // 选择视角 2、3、2.5d
    baseLayerPicker: false, // 图层选择
    navigationHelpButton: false, // 导航帮助
    animation: true, // 动画组件
    timeline: true, // 时间线组件
    fullscreenButton: false, // 全屏按钮
    vrButton: false,
    creditContainer: "credit",
    selectionIndicator: false, // 绿色瞄准框
    infoBox: false // 右上点击弹窗
    // skyBox: new SkyBox({
    //   sources: {
    //     positiveX: skyboxImgs.px,
    //     negativeX: skyboxImgs.nx,
    //     positiveY: skyboxImgs.py,
    //     negativeY: skyboxImgs.ny,
    //     positiveZ: skyboxImgs.pz,
    //     negativeZ: skyboxImgs.nz,
    //   }
    // })
  });
  viewer.scene.debugShowFramesPerSecond = true; // 显示性能指标
  viewer.scene.skyAtmosphere.show = false; // 去掉大气
  viewer.scene.globe.depthTestAgainstTerrain = true; // 防止视角转到地下
  viewer.scene.sun.show = true;
  viewer.scene.globe.shadows = ShadowMode.DISABLED; // 设置阴影
  viewer.shadowMap.darkness = 0.7; // 调整阴影明暗
  (viewer as any)._cesiumWidget._creditContainer.style.display = 'none'
  // sky box

  // 影像图
  layer = new UrlTemplateImageryProvider({
    url: "https://webst02.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
    minimumLevel: 3,
    maximumLevel: 18,
  });

  labelLayer = new UrlTemplateImageryProvider({
    url:
      "http://webst02.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8",
    minimumLevel: 3,
    maximumLevel: 18,
  });
  console.log(viewer.imageryLayers, 'requestRenderMode');
  viewer.imageryLayers.addImageryProvider(layer);
  viewer.imageryLayers.addImageryProvider(labelLayer);
  // viewer.imageryLayers.addImageryProvider(new IonImageryProvider({ assetId: 3 }));
  // viewer.terrainProvider = new CesiumTerrainProvider({
  //   url: IonResource.fromAssetId(1)
  // })

  viewer.imageryLayers.remove(viewer.imageryLayers.get(0))

  /** entity 5 */
  //动态计算点颜色
  const getPointColor = (time: JulianDate, result: any) => {
    var frequency = 2.0;  //闪烁频率
    var amplitude = 0.5;  //闪烁幅度
    var offset = 1.0;     //颜色偏移量
    var alpha = 1.0;      //点的透明度
    var val = Math.sin(new Date().getSeconds() * frequency) * amplitude + offset;  //计算颜色值
    result = new Color(val, 1.0 - val, 0.0, alpha);  //返回颜色值
    return result;
  }
  const rectBox = viewer.entities.add({
    id: 'testbox',
    name: 'rectbox',
    position: Cartesian3.fromDegrees(107, 40, 0),
    // box: {
    //   dimensions: new Cartesian3(80000, 40000, 100000), // 左手笛卡尔坐标系
    //   material: Color.BLUE.withAlpha(0.6),
    //   outline: true,
    //   outlineColor: Color.RED,
    //   outlineWidth: 20
    // },
    point: {
      heightReference: HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      color: new CallbackProperty(getPointColor, false),
      pixelSize: 20,
      outlineWidth: 10,
      outlineColor: Color.BLUEVIOLET,
    },
    label: {
      text: '这是一棵树',
      heightReference: HeightReference.CLAMP_TO_GROUND,
      pixelOffset: new Cartesian2(0, -60),
      pixelOffsetScaleByDistance: new NearFarScalar(1500, 0.7, 200000, 1),
      translucencyByDistance: new NearFarScalar(1500, 1, 200000, 0.5),
      scaleByDistance: new NearFarScalar(1500, 1, 20000, 0.5),
      distanceDisplayCondition: new DistanceDisplayCondition(0, 300000),
      fillColor: Color.GREEN,
    },
    // polyline: {
    //   positions: Cartesian3.fromDegreesArray([107, 40, 107, 39, 107, 38, 107 ,35, 106, 32]),
    //   width: 5,
    //   material: new PolylineGlowMaterialProperty({glowPower: 0.4, color: Color.AQUA}),
    // },
    // billboard: {
    //   image: new URL('../assets/images/three.png', import.meta.url).href,
    //   scaleByDistance: new NearFarScalar(1500, 1, 20000, 0.5),
    //   translucencyByDistance: new NearFarScalar(1500, 1, 200000, 0.5),
    //   distanceDisplayCondition: new DistanceDisplayCondition(0, 300000),
    //   heightReference: HeightReference.CLAMP_TO_GROUND,
    //   width: 50,
    //   height: 70
    // },
    ellipse: {
      semiMajorAxis: 500,
      semiMinorAxis: 300,
      heightReference: HeightReference.CLAMP_TO_GROUND,
      material: new CheckerboardMaterialProperty({
        evenColor: Color.WHITE,
        oddColor: Color.BLACK,
        repeat: new Cartesian2(8, 8),
      }),
      // extrudedHeight: 1000,
      rotation: CesiumMath.toRadians(45)
    },
    // cylinder: {
    //   topRadius: 400,
    //   bottomRadius: 400,
    //   length: 800,
    //   heightReference: HeightReference.CLAMP_TO_GROUND,
    //   material: Color.BLANCHEDALMOND.withAlpha(0.7)
    // },
    // polygon: {

    // }
  })

  const testBox = viewer.entities.add({
    name: 'testbox',
    position: Cartesian3.fromDegrees(107, 40, 2000),
    box: {
      dimensions: new Cartesian3(1000, 1000, 1000),
      material: Color.BLUE.withAlpha(0.5),
      outline: true,
      outlineColor: Color.BLACK
    }
  })
  const property = new SampledProperty(Cartesian3)
  property.addSample(JulianDate.fromIso8601('2023-12-18T00:00:00Z'), new Cartesian3(1000, 1000, 1000))
  property.addSample(JulianDate.fromIso8601('2023-12-19T16:20:01Z'),new Cartesian3(1000, 1000, 8000))
  testBox.box.dimensions = property
  viewer.flyTo(testBox)
  viewer.clock.multiplier = 10;
  
  // viewer.entities.removeById('testbox')

  // const boundingSphere = new BoundingSphere(Cartesian3.fromDegrees(107, 40, 2000), 2000)
  // viewer.camera.flyToBoundingSphere(boundingSphere, {
  //   duration: 1,
  //   offset: new HeadingPitchRange(CesiumMath.toRadians(20), CesiumMath.toRadians(0), 0)
  // })
  // console.log('rectBox', rectBox);



  var czml = [{
    "id": "document",
    "name": "box",
    "version": "1.0"
  }, {
    "id": "shape2",
    "name": "Red box with black outline",
    "position": {
      "cartographicDegrees": [-107.0, 40.0, 300000.0]
    },
    "box": {
      "dimensions": {
        "cartesian": [400000.0, 300000.0, 500000.0]
      },
      "material": {
        "solidColor": {
          "color": {
            "rgba": [255, 0, 0, 128]
          }
        }
      },
      "outline": true,
      "outlineColor": {
        "rgba": [0, 0, 0, 255]
      }
    }
  }];

  var dataSourcePromise = CzmlDataSource.load(czml);
  const source = await viewer.dataSources.add(dataSourcePromise)
  source.show = false
  // viewer.zoomTo(dataSourcePromise);
  // viewer.dataSources.remove(source)

  // viewer.zoomTo(rectBox)
  // viewer.trackedEntity = rectBox


  viewer.camera.setView({ destination: Cartesian3.fromDegrees(107, 40, 12000), orientation: new HeadingPitchRoll(CesiumMath.toRadians(90), CesiumMath.toRadians(-90), CesiumMath.toRadians(0)) })

  // const geojsonPromise = viewer.dataSources.add(GeoJsonDataSource.load('/geojson/json1.json', {
  //   fill: Color.ANTIQUEWHITE.withAlpha(0.6),
  //   stroke: Color.ANTIQUEWHITE,
  //   strokeWidth: 5
  // }))
  // geojsonPromise.then(data => {
  //   console.log(data, 'datasource json');
  // })


  const options: any = {};
  // 用于在使用重置导航重置地图视图时设置默认视图控制。接受的值是Cesium.Cartographic 和 Cesium.Rectangle.
  // options.defaultResetView = Rectangle.fromDegrees(80, 22, 130, 50)
  options.defaultResetView = new Cartographic(
    CesiumMath.toRadians(111.50623801848565),
    CesiumMath.toRadians(2.8997206760441205),
    8213979.400955964
  );
  //相机方向
  options.orientation = {
    heading: CesiumMath.toRadians(350.94452087411315),
    pitch: CesiumMath.toRadians(-66.6402342251215),
    roll: CesiumMath.toRadians(360),
  };
  //相机延时
  options.duration = 4; //默认为3s

  // 用于启用或禁用罗盘。true是启用罗盘，false是禁用罗盘。默认值为true。如果将选项设置为false，则罗盘将不会添加到地图中。
  options.enableCompass = true;
  // 用于启用或禁用缩放控件。true是启用，false是禁用。默认值为true。如果将选项设置为false，则缩放控件将不会添加到地图中。
  options.enableZoomControls = true;
  // 用于启用或禁用距离图例。true是启用，false是禁用。默认值为true。如果将选项设置为false，距离图例将不会添加到地图中。
  options.enableDistanceLegend = true;
  // 用于启用或禁用指南针外环。true是启用，false是禁用。默认值为true。如果将选项设置为false，则该环将可见但无效。
  options.enableCompassOuterRing = true;

  //修改重置视图的tooltip
  options.resetTooltip = "重置视图";
  //修改放大按钮的tooltip
  options.zoomInTooltip = "放大";
  //修改缩小按钮的tooltip
  options.zoomOutTooltip = "缩小";

  //如需自定义罗盘控件，请看下面的自定义罗盘控件
  new CesiumNavigation(viewer, options);
});

</script>

<style lang="scss">
.cesium-container {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
