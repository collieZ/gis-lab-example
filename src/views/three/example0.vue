<template>
  <div ref="webglRef"></div>
  <div class="inner-map">
    <minemap></minemap>
  </div>
  <div class="tip-board">
    <NButton type="primary" @click="resetCamera(camera)">初始视角</NButton>
    <NButton type="primary" @click="setCamera1(camera)">第一人称</NButton>
    <NButton type="primary" @click="setCamera2(camera)">第一人称--靠后</NButton>
    <NButton type="primary" @click="setCamera3(camera)">第三人称</NButton>
    <NButton type="primary" @click="start">开始</NButton>
    <NButton type="primary" @click="stop">暂停</NButton>
    <NTag type="success" size="large">{{ `当前已驶过${cPercent.toFixed(3)}%` }}</NTag>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as THREE from 'three'
import { NTag, NButton } from 'naive-ui'
import { useFps } from '@vueuse/core'
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from 'three/addons/libs/stats.module'
import { onMounted } from 'vue'
import { useEventListener } from '@vueuse/core'
import { throttle } from 'lodash-es'

import * as dat from "dat.gui";

import { coordinateTransform, coordinateLineTransform, carDataCoordinateTransform } from '@/utils/transformCoor.js'
import { dataroad } from "./assets/data_road_relation.js";
import { sidewalk } from './assets/data_corss'
import { databoundaryline } from './assets/data_boundary_line'
import { datalaneboundaryline } from './assets/data_lane_boundary_line'
import { datalaneguidearrow } from './assets/data_lane_guide_arrow'
import { datacar } from './assets/data_car'
import { onUnmounted } from 'vue';
import minemap from '../minemap/example0.vue'
import { watchEffect } from 'vue';

const gui = new dat.GUI();

let targetEuler = new THREE.Euler(0, 0, 0, 'YXZ'); // 初始目标欧拉角
const interpolationFactor = 0.05; // 插值因子，控制平滑程度

let yuandian = [106.334175108, 29.511784777]

const points = carDataCoordinateTransform(yuandian, datacar.data)

/**
 * 初始化视角切换
 */
let followCameraObject: THREE.Object3D;

const resetCamera = (camera: THREE.PerspectiveCamera) => {
  camera.position.set(0, 500, 100)
  camera.up.set(0, 1, 0)
  camera.lookAt(0, 0, 0)
  camera.updateProjectionMatrix()
}

const viewMode = ref(0) // 0: 3D 第一人称, 1: 第一人很称 -- 靠后， 2： 第三人称

/**
 * 第一人称
 */
const setCamera1 = (camera: THREE.PerspectiveCamera) => {
  // camera.position.set(0, 0, 100)
  // camera.lookAt(0, 0, 0)
  // camera.updateProjectionMatrix()

  viewMode.value = 0
}

/**
 * 第一人称 -- 靠后
 */
const setCamera2 = (camera: THREE.PerspectiveCamera) => {
  // camera.position.set(0, 0, 100)
  // camera.lookAt(0, 0, 0)
  // camera.updateProjectionMatrix()

  viewMode.value = 1
}

/**
 * 第三人称
 */
const setCamera3 = (camera: THREE.PerspectiveCamera) => {
  // camera.position.set(0, 0, 100)
  // camera.lookAt(0, 0, 0)
  // camera.updateProjectionMatrix()
  viewMode.value = 2
}

const createTrafficRoad = (scene: THREE.Scene) => {
  // 1. 经纬度坐标转 Threejs 坐标 （要考虑哪种经纬度坐标）
  const coor = coordinateTransform(yuandian, dataroad.data.features)
  for (let i = 0; i < coor.length; i++) {
    const element = coor[i];
    var rectShape = new THREE.Shape();
    rectShape.moveTo(element.coordinates[0][0].x, element.coordinates[0][0].y); // 移动到初始点位
    for (let j = 1; j < element.coordinates[0].length; j++) {
      const elementj = element.coordinates[0][j];
      rectShape.lineTo(elementj.x, elementj.y);
    }
    rectShape.lineTo(element.coordinates[0][0].x, element.coordinates[0][0].y); // 再次移动到初始点位，行程闭合多边形
    var geometry = new THREE.ShapeGeometry(rectShape);
    const texLoader = new THREE.TextureLoader();
    const textureRoad = texLoader.load("http://elpsycongroo7.cn:999/lumiancaizhi.jpg");
    textureRoad.repeat = new THREE.Vector2(5, 5);
    textureRoad.wrapS = THREE.RepeatWrapping
    textureRoad.wrapT = THREE.MirroredRepeatWrapping
    let material = new THREE.MeshBasicMaterial({
      map: textureRoad, //map表示材质的颜色贴图属性
      // color: 0x66ccff,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    // mesh.position.x = - Math.PI / 2
    mesh.rotateX(THREE.MathUtils.degToRad(-90))
    scene.add(mesh)
  }
}

const createTrafficSideWalk = (scene: THREE.Scene) => {
  // 1. 经纬度坐标转 Threejs 坐标 （要考虑哪种经纬度坐标）
  const coor = coordinateTransform(yuandian, sidewalk.data.features)
  for (let i = 0; i < coor.length; i++) {
    const element = coor[i];
    var rectShape = new THREE.Shape();
    rectShape.moveTo(element.coordinates[0][0].x, element.coordinates[0][0].y); // 移动到初始点位
    for (let j = 1; j < element.coordinates[0].length; j++) {
      const elementj = element.coordinates[0][j];
      rectShape.lineTo(elementj.x, elementj.y);
    }
    rectShape.lineTo(element.coordinates[0][0].x, element.coordinates[0][0].y); // 再次移动到初始点位，行程闭合多边形
    var geometry = new THREE.ShapeGeometry(rectShape);
    let material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      // color: 0xee66ff,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    // mesh.position.x = - Math.PI / 2
    mesh.position.y = 1
    mesh.rotateX(THREE.MathUtils.degToRad(-90))
    scene.add(mesh)
  }
}

// 路边线
const createTrafficSideLine = (scene: THREE.Scene) => {
  const coor = coordinateTransform(yuandian, databoundaryline.data.features)
  for (let i = 0; i < coor.length; i++) {
    const element = coor[i];
    element.coordinates.forEach((k: any) => {
      const points = k.map((j: any) => {
        return new THREE.Vector3(j.x, j.y, j.z)
      })
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: '#00ff00' });
      let line = new THREE.Line(geometry, material);
      line.name = "MultiLineString" + i + k
      // line.rotation.x = -Math.PI / 2;
      // line.rotation.z = -Math.PI / 2;
      // line.position.y = yIndex
      line.rotateX(THREE.MathUtils.degToRad(-90))
      scene.add(line);
    })
  }
}

// 车道线
const createTrafficLine = (scene: THREE.Scene) => {
  // 1. 经纬度坐标转 Threejs 坐标 （要考虑哪种经纬度坐标）
  const coor = coordinateLineTransform(yuandian, datalaneboundaryline.data.features)
  for (let i = 0; i < coor.length; i++) {
    const element = coor[i];
    if (element.properties.type === "solid") {
      // solid 实线
      const points = element.coordinates.map((j: any) => {
        return new THREE.Vector3(j.x, j.y, j.z)
      }) // 生成顶点
      const geometry = new THREE.BufferGeometry().setFromPoints(points); // 生成线几何体
      const material = new THREE.LineBasicMaterial({
        linewidth: 500,
        color: '#ffeeee'
      }); // 设置材质

      // const material = new THREE.LineBasicMaterial({ color: color });
      let line = new THREE.Line(geometry, material);
      // line.computeLineDistances();
      line.name = "LineString" + i
      // line.rotation.x = -Math.PI / 2;
      // line.rotation.z = -Math.PI / 2;
      // line.position.y = yIndex
      line.rotateX(THREE.MathUtils.degToRad(-90))
      scene.add(line);
    } else {
      // broken 虚线
      const points = element.coordinates.map(j => {
        return new THREE.Vector3(j.x, j.y, j.z)
      })
      var lineOpt = {
        color: '#ff0000',
        dashSize: 15000,
        gapSize: 5000,
      };

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineDashedMaterial(lineOpt);
      var line = new THREE.LineSegments(geometry, material);
      line.computeLineDistances();
      line.name = "LineStringDashed" + i
      // line.rotation.x = -Math.PI / 2;
      // line.rotation.z = -Math.PI / 2;
      // line.position.y = yIndex
      line.rotateX(THREE.MathUtils.degToRad(-90))
      scene.add(line);
    }
  }
}

// 路标
const createTrafficLabel = (scene: THREE.Scene) => {
  const coor = coordinateTransform(yuandian, datalaneguidearrow.data.features)
  for (let i = 0; i < coor.length; i++) {
    const element = coor[i];
    var rectShape = new THREE.Shape();
    rectShape.moveTo(element.coordinates[0][0].x, element.coordinates[0][0].y); // 移动到初始点位
    for (let j = 1; j < element.coordinates[0].length; j++) {
      const elementj = element.coordinates[0][j];
      rectShape.lineTo(elementj.x, elementj.y);
    }
    rectShape.lineTo(element.coordinates[0][0].x, element.coordinates[0][0].y); // 再次移动到初始点位，行程闭合多边形
    var geometry = new THREE.ShapeGeometry(rectShape);
    let material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    // mesh.position.x = - Math.PI / 2
    mesh.position.y = 2
    mesh.rotateX(THREE.MathUtils.degToRad(-90))
    scene.add(mesh)
  }
}

let ownercar: THREE.Mesh;
let curve: THREE.CatmullRomCurve3;
// 创建自己车
const createOwnCar = (scene: THREE.Scene) => {
  //给方块添加材质
  const cubeGeometry = new THREE.BoxGeometry(10, 10, 50);
  const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0x9f00ff });
  ownercar = new THREE.Mesh(cubeGeometry, cubeMaterial);
  // ownercar.position.z = 1
  // 创建跟随像机
  // let followCamera = new THREE.Object3D();
  // followCamera.position.x = -100;
  // followCamera.position.y = 50;
  // followCamera.position.z = 100;
  // ownercar.add(followCamera)
  // // 创建第一人称目标物
  // let fristTarget = new THREE.Object3D();
  // fristTarget.position.x = 70;
  // fristTarget.position.y = 0;
  // fristTarget.position.z = 5;
  // ownercar.add(fristTarget)

  // ownercar.position.x = points[0].position_three[0];
  // ownercar.position.y = points[0].position_three[1];
  ownercar.position.y = 1.5
  ownercar.castShadow = true
  const axesHelper = new THREE.AxesHelper(200);
  ownercar.add(axesHelper)
  scene.add(ownercar);

  // 去除间隔时间小于 500 的点
  const linePoints = points.reduce((pre, cur, index) => {
    if (index === 0) {
      return [...pre, cur];
    }
    const interval = cur.ts - pre[pre.length - 1].ts;
    if (interval > 500) {
      return [...pre, cur];
    } else {
      return pre
    }
  }, [])


  // 绘制车辆行驶路线
  const pointsss = linePoints.map((j: any) => {
    return new THREE.Vector3(j.position_three[0], j.position_three[1], 0)
  })


  // const geometry = new THREE.BufferGeometry().setFromPoints(pointsss);
  // const material = new THREE.LineBasicMaterial({ color: 0xff00ff });
  // let line = new THREE.Line(geometry, material);
  // scene.add(line);

  pointsss.forEach((p: THREE.Vector3) => {
    p.applyAxisAngle(new THREE.Vector3(1, 0, 0), THREE.MathUtils.degToRad(-90))
  });

  // 绘制车辆路线曲线，采用的是 CatmullRom 插值法
  curve = new THREE.CatmullRomCurve3(pointsss);

  // 500 等分点，生成点 BufferGeometry
  const pp = curve.getSpacedPoints(500)
  const geometry2 = new THREE.BufferGeometry().setFromPoints(pp);
  const material2 = new THREE.LineBasicMaterial({ color: 0xff00ff });
  let line2 = new THREE.Line(geometry2, material2);


  const material3 = new THREE.LineBasicMaterial({ color: 0xff0 });
  const linePointtest = new THREE.Points(geometry2, material3)
  // line2.rotateX(THREE.MathUtils.degToRad(-90))
  scene.add(line2);
  scene.add(linePointtest);
}

const TOTAL_TIME = 8 * 1000 * 60; // 3分钟
let curTime = 0 // 当前已运动时间
const fps = useFps()
const cPercent = ref(0)
const runCar = (): THREE.Vector3 | undefined => {
  if (ownercar && !isStop.value) {

    curTime += (1000 / (fps.value || 60))
    const percent = curTime / TOTAL_TIME // 已运动百分比
    cPercent.value = percent
    // 获取当前百分比的点位数据
    const point = curve.getPoint(percent);
    // 设置车模型到该点位
    ownercar.position.copy(point);

    // 获取该点位的切线
    const tangent = curve.getTangent(percent).normalize();
    // 设置车模型朝向该切线方向 （注意：add 是向量相加，等同于平移，因为生成的切向量在原点）
    const lookAtVec = tangent.add(ownercar.position)
    ownercar.lookAt(lookAtVec);
    return tangent
  }
}

let controls: OrbitControls

const isStop = ref(false)
const stop = () => {
  isStop.value = true
  // controls.enabled = true
}

const start = () => {
  isStop.value = false
  // controls.enabled = false
}

const webglRef = ref(null)

function addCameraHelper(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const helper = new THREE.CameraHelper(camera)
  scene.add(helper)
}

let camera: THREE.PerspectiveCamera
const initScene = () => {
  /** 1. 创建一个场景 */
  const scene = new THREE.Scene()

  /** 2. 创建一个相机 */
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 10000)
  addCameraHelper(scene, camera)


  /** 3. 创建渲染器 */
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, precision: 'highp', alpha: true, logarithmicDepthBuffer: true })
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 添加渲染器canvas元素
  (webglRef.value as unknown as HTMLDivElement).appendChild(renderer.domElement);
  renderer.setClearColor('#B4D3BA');

  /** 创建立方体 */
  // const geometry = new THREE.BoxGeometry(1, 1, 1); // 立方体
  // const material = new THREE.MeshLambertMaterial({ color: 0xffeeee }); // 材质
  // const cube = new THREE.Mesh(geometry, material); // 网格 （类似uv 贴图？）
  // scene.add(cube);
  // cube.position.x = -2;
  // cube.position.y = 1;
  // cube.position.z = 2;

  /**
   * 4. 创建视角控制器
   */
  const createControls = (): OrbitControls => {
    const controls = new OrbitControls(camera, renderer.domElement);
    const cleanup = useEventListener(controls, 'change', () => {
      renderer.render(scene, camera);
    })//监听鼠标、键盘事件
    onUnmounted(() => {
      cleanup()
      controls.dispose()
    })
    controls.enableRotate = true; //启用旋转
    controls.enablePan = true; //启用平移
    controls.enableZoom = true; //启用缩放
    controls.enableDamping = true // 启用拖拽阻尼
    controls.dampingFactor = 0.1 // 拖拽阻尼系数
    controls.update();
    return controls
  }
  controls = createControls()

  /**
   * 5. 创建光源
   */
  let light: THREE.SpotLight;
  const createLight = () => {
    //Create a DirectionalLight and turn on shadows for the light
    light = new THREE.SpotLight(0xffffff, 1);
    light.position.set(0, 400, 0); //default; light shining from top
    light.castShadow = true; // default false
    light.target = scene
    light.name = "SpotLight"
    gui.add(light, 'intensity').min(0).max(1).step(0.1).name('SpotLight')
    scene.add(light);
    let light2 = new THREE.AmbientLight(0xffffff, 0.1)
    light2.position.set(0, 400, 0);
    gui.add(light2, 'intensity').min(0).max(1).step(0.1)
    scene.add(light2);
  }
  createLight()

  /** 浏览器窗口变动更新场景和画布 */
  const onWindowResize = throttle(() => {
    // 重新设置相机宽高比例
    camera.aspect = window.innerWidth / window.innerHeight;
    // 更新相机投影矩阵
    camera.updateProjectionMatrix();
    // 重新设置渲染器渲染范围
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, 500)
  window.addEventListener('resize', onWindowResize)
  onUnmounted(() => {
    window.removeEventListener('resize', onWindowResize)
    gui.destroy()
    stats.domElement.remove()
  })


  /**
 * 创建一个平面
 */
  const createPlane = () => {
    /*给物体添加光感材质*/
    //普通材质MeshBasicMaterial对光源是没有反应的，所以我们要修改为对光源产生反应的MeshLambertMaterial和MeshPhongMaterial
    //给平面添加材质
    const planeGeometry = new THREE.PlaneGeometry(100000, 100000);
    const planeMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffff,
      // side: THREE.DoubleSide //两面 // THREE.FrontSide 、THREE.BackSide
    });
    let plane = new THREE.Mesh(planeGeometry, planeMaterial);
    //水平面旋转并且设置位置
    // plane.rotation.x = -0.5 * Math.PI;
    plane.position.x = 0;
    plane.position.y = -1;
    plane.position.z = 0;
    plane.rotateX(THREE.MathUtils.degToRad(-90))
    //平面是接受阴影
    plane.receiveShadow = true;
    scene.add(plane);
  }
  createPlane()

  camera.position.z = 80; // 相机移动一点，防止和物体重合
  camera.position.y = 800; // 相机移动一点，防止和物体重合

  /** 1. 画路面 */
  createTrafficRoad(scene)
  /** 2. 画交叉路口人行道 */
  createTrafficSideWalk(scene)
  /** 3. 画路面边线 */
  createTrafficSideLine(scene)
  /** 4. 画车道线 */
  createTrafficLine(scene)
  /** 5. 画路标箭头 */
  createTrafficLabel(scene)
  /**6. 绘制小车 */
  createOwnCar(scene);

  // @ts-ignore
  light.target = ownercar

  //告诉渲染器，我们需要阴影映射
  renderer.shadowMap.enabled = true;

  const axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  // ownercar.rotation.y = -Math.PI / 2

  // camera catch
  const followCarObj = new THREE.Object3D()
  const geom = new THREE.BoxGeometry(10, 10, 10)
  const followBox = new THREE.Mesh(geom, new THREE.MeshBasicMaterial({ color: 0x00ff00 }))
  followCarObj.position.set(0, 10, 80)
  followBox.position.set(0, 10, 80)
  // followCarObj.position.set(0, 100, -100)
  ownercar.add(followBox)
  ownercar.add(followCarObj)

  //创建stats对象
  const stats = new Stats();
  stats.setMode(0)
  //stats.domElement:web页面上输出计算结果,一个div元素，
  document.body.appendChild(stats.domElement);
  ownercar.add(camera)

  watchEffect(() => {
    if (viewMode.value === 0) {
      camera.position.set(0, 10, 50) // 第一人称
      controls.enabled = false
    } else if (viewMode.value === 1) {
      camera.position.set(0, 20, -80) // 第一人称 -- 靠后一点
      controls.enabled = false
    } else if (viewMode.value === 2) {
      controls.enabled = true
      camera.position.set(0, 300, -80) // 第三人称
    }
  })



  function animate() {
    stats.update();

    // 帧间差值
    // const currentQuaternion = camera.quaternion.clone();
    // const targetQuaternion = new THREE.Quaternion().setFromEuler(targetEuler);
    // const interpolatedQuaternion = new THREE.Quaternion().slerp(targetQuaternion, interpolationFactor);
    // camera.quaternion.copy(interpolatedQuaternion);

    runCar()
    const followBoxPos = new THREE.Vector3()

    followCarObj.getWorldPosition(followBoxPos)
    // followBox.position.set(followBoxPos.x, followBoxPos.y, followBoxPos.z)

    // const carvec = new THREE.Vector3(0, 0, 0)
    // const carPos = ownercar.getWorldPosition(carvec)
    // carPos.add(new THREE.Vector3(-20, 0, 0))
    // if (controls.enabled) {

    // }
    // if (viewMode.value === 0) {
    //   camera.position.set(0, 10, 50) // 第一人称
    //   controls.enabled = false
    // } else if (viewMode.value === 1) {
    //   camera.position.set(0, 20, -80) // 第一人称 -- 靠后一点
    //   controls.enabled = false
    // } else if (viewMode.value === 2) {
    //   controls.enabled = true
    //   camera.position.set(0, 300, -80) // 第三人称
    // }
    // ownercar.add(camera)
    camera.lookAt(followBoxPos)
    let newTarget = new THREE.Vector3(followBoxPos.x, followBoxPos.y, followBoxPos.z); // 新的中心点位置
    // let newTarget = new THREE.Vector3(carPos.x, carPos.y, carPos.z); // 新的中心点位置
    controls.target.copy(newTarget); // 将中心点的位置设置为新的位置
    controls.update()
    // camera.position.set(carPos.x, 20, carPos.z)
    // camera.lookAt(followBoxPos)
    // ownercar.add(camera)

    // camera.position.set(carPos.x, 20, carPos.z)
    // camera.position.set(followBoxPos.x, followBoxPos.y, followBoxPos.z)
    // camera.lookAt(ownercar.position)


    // let newTarget = new THREE.Vector3(followBoxPos.x, followBoxPos.y, followBoxPos.z); // 新的中心点位置
    // controls.target.copy(newTarget); // 将中心点的位置设置为新的位置
    // controls.update()
    // let newTarget = new THREE.Vector3(ownercar.position.x, ownercar.position.y, ownercar.position.z); // 新的中心点位置
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

}


onMounted(() => {
  initScene()
})
</script>

<style scoped>
.inner-map {
  position: absolute;
  width: 200px;
  height: 200px;
  bottom: 100px;
  right: 100px;
  overflow: hidden;
  border-radius: 50%;
}

.tip-board {
  position: absolute;
  top: 0;
  left: 200px;
  width: 200px;
  height: 200px;
  z-index: 99;
  user-select: none;

  width: 60vw;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  gap: 20px;
}
</style>