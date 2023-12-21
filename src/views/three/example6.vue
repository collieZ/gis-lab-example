<template>
  <div>
    <div ref="webglRef"></div>
    <div class="tip-board">
      <NButton type="primary" @click="stop">停止</NButton>
      <NButton type="primary" @click="resetView">复原</NButton>
      <n-space>
        <n-switch v-model:value="cameraswing">
          <template #checked>
            相机晃动
          </template>
          <template #unchecked>
            相机静止
          </template>
        </n-switch>
        <n-switch v-model:value="viewPointSwing">
          <template #checked>
            视点晃动
          </template>
          <template #unchecked>
            视点静止
          </template>
        </n-switch>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { MapControls } from 'three/addons/controls/MapControls'
import Stats from 'three/addons/libs/stats.module'
import { useFps } from '@vueuse/core'
import { NButton, NSwitch, NSpace } from 'naive-ui'
import { onMounted } from 'vue'
import { useEventListener } from '@vueuse/core'
import { throttle, random } from 'lodash-es'
import gsap from 'gsap';

import * as dat from "dat.gui";
import { onUnmounted } from 'vue';

import { coordinateTransform, coordinateLineTransform, carDataCoordinateTransform } from '@/utils/transformCoor.js'
import { dataroad } from "./assets/data_road_relation.js";
import { datalaneboundaryline } from './assets/data_lane_boundary_line'
import { sidewalk } from './assets/data_corss'
import { datalaneguidearrow } from './assets/data_lane_guide_arrow'
import { datacar } from './assets/data_car'
import { databoundaryline } from './assets/data_boundary_line'
let stats: any;
let viewPoint: THREE.Mesh
const cameraswing = ref(false)
const viewPointSwing = ref(false)
let t1: NodeJS.Timer, t2: NodeJS.Timer;
watchEffect(() => {
  if (cameraswing.value) {
    swingCamera(camera)
  } else {
    clearInterval(t1)
  }
  if (viewPointSwing.value) {
    swingViewPoint()
  } else {
    clearInterval(t2)
  }
})
const stop = () => {
  cameraswing.value = false
  viewPointSwing.value = false
}

const bindCamera = (car: THREE.Mesh, camera: THREE.PerspectiveCamera) => {
  car.add(camera)
  camera.position.set(0, 20, -80)
}

const createViewPoint = () => {
  viewPoint = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5
    })
  )
  viewPoint.position.set(0, 10, 80)
  return viewPoint
  // scene.add(viewPoint)
}

const resetView = () => {
  camera.position.set(0, 20, -80)
  viewPoint.position.set(0, 10, 80)
}

const swingCamera = (camera: THREE.PerspectiveCamera) => {
clearInterval(t1)
 t1 = setInterval(() => {
    gsap.to(camera.position, {
      x: random(-5, 5),
      y: random(-5, 5) + 20,
      z: random(-5, 5) + -80,
      duration: 0.3
    })
    // camera.position.set(0 + random(-5, 5), 30 + random(-5, 5), -50 + random(-5, 5))
  }, 400)
}

const swingViewPoint = () => {
  clearInterval(t2)
  t2 = setInterval(() => {
    gsap.to(viewPoint.position, {
      x: random(-5, 5),
      y: random(-5, 5) + 10,
      z: random(-5, 5) + 80,
      duration: 0.3
    })
    // viewPoint.position.set(0 + random(-5, 5), 10 + random(-5, 5), 30 + random(-5, 5))
  }, 400)
}

const gui = new dat.GUI();

let yuandian = [106.334175108, 29.511784777]
const points = carDataCoordinateTransform(yuandian, datacar.data, 2)
let controls: OrbitControls
let camera: THREE.PerspectiveCamera
const webglRef = ref(null)


function addCameraHelper(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const helper = new THREE.CameraHelper(camera)
  scene.add(helper)
}


const initScene = () => {
  /** 1. 创建一个场景 */
  const scene = new THREE.Scene()

  /** 2. 创建一个相机 */
  camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 3000)
  addCameraHelper(scene, camera)

  /** 3. 创建渲染器 */
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, precision: 'highp', alpha: true, logarithmicDepthBuffer: true })
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 添加渲染器canvas元素
  (webglRef.value as unknown as HTMLDivElement).appendChild(renderer.domElement);
  // renderer.setClearColor('#B4D3BA');
  // const mapControls = new MapControls(camera, renderer.domElement);

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
    controls.minDistance = 100
    controls.maxDistance = 500
    controls.update();
    return controls
  }
  controls = createControls()

  /**
   * 5. 创建光源
   */
  let light: THREE.SpotLight;
  const createLight = () => {
    light = new THREE.SpotLight(0xffffff, 1);
    light.position.set(0, 100, 200); //default; light shining from top
    light.castShadow = true; // default false
    light.target = scene
    light.name = "SpotLight"
    // const spotLightHelper = new THREE.SpotLightHelper(light, 0xffffff)
    // scene.add(spotLightHelper);
    gui.add(light, 'intensity').min(0).max(10000).step(0.1).name('SpotLight')
    scene.add(light);
    let light2 = new THREE.AmbientLight(0xffffff, 2)
    light2.position.set(0, 50, 100);
    gui.add(light2, 'intensity').min(0).max(100).step(0.1)
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
  }, 300)
  window.addEventListener('resize', onWindowResize)
  onUnmounted(() => {
    window.removeEventListener('resize', onWindowResize)
  })

  camera.position.z = 100; // 相机移动一点，防止和物体重合
  camera.position.y = 40; // 相机移动一点，防止和物体重合


  //告诉渲染器，我们需要阴影映射
  renderer.shadowMap.enabled = true;

  // 添加辅助坐标轴
  const axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  //创建stats对象
  const stats = new Stats();
  stats.setMode(0)
  document.body.appendChild(stats.domElement);

  // createEarth(scene)

  createTrafficRoad(scene)
  createTrafficLine(scene)
  createTrafficSideWalk(scene)
  createTrafficLabel(scene)
  createTrafficSideLine(scene)
  createOwnCar(scene)

  
  
  createViewPoint();
  ownercar.add(viewPoint)
  bindCamera(ownercar, camera)
  
  function animate() {
    stats.update();
    
    
    runCar()
    const followBoxPos = new THREE.Vector3()
    viewPoint.getWorldPosition(followBoxPos)
    controls.enabled = false
    camera.lookAt(followBoxPos)
    // let newTarget = new THREE.Vector3(followBoxPos.x, followBoxPos.y, followBoxPos.z); // 新的中心点位置
    // controls.target.copy(newTarget); // 将中心点的位置设置为新的位置
    // controls.update()
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}


onMounted(() => {
  initScene()
})

onUnmounted(() => {
  gui.destroy()
  stats.domElement.remove()
})

// 创建地球 半径100
function createEarth(scene: THREE.Scene, radius = 6371) {
  var earthGeo = new THREE.SphereGeometry(radius, 64, 64);
  var earthMater = new THREE.MeshPhongMaterial({
    // map: new THREE.TextureLoader().load('assets/earth/earth3.jpg'),
    // transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    opacity: 0.8,
    color: 0x03d98e
  });
  var earthMesh = new THREE.Mesh(earthGeo, earthMater);
  scene.add(earthMesh)
}

const createTrafficRoad = (scene: THREE.Scene) => {
  // 1. 经纬度坐标转 Threejs 坐标 （要考虑哪种经纬度坐标）
  const coor = coordinateTransform(yuandian, dataroad.data.features, 2)
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
    let material = new THREE.MeshStandardMaterial({
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

// 车道线
const createTrafficLine = (scene: THREE.Scene) => {
  // 1. 经纬度坐标转 Threejs 坐标 （要考虑哪种经纬度坐标）
  const coor = coordinateLineTransform(yuandian, datalaneboundaryline.data.features, 2)
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
      // line.geometry.center()
      // line.rotation.x = -Math.PI / 2;
      // line.rotation.z = -Math.PI / 2;
      // line.position.y = yIndex
      line.rotateX(THREE.MathUtils.degToRad(-90))
      // line.rotateY(THREE.MathUtils.degToRad(-90))

      scene.add(line);
    }
  }
}

const createTrafficSideWalk = (scene: THREE.Scene) => {
  // 1. 经纬度坐标转 Threejs 坐标 （要考虑哪种经纬度坐标）
  const coor = coordinateTransform(yuandian, sidewalk.data.features, 2)
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
    let material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      // color: 0xee66ff,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    // mesh.position.x = - Math.PI / 2
    mesh.position.y = 0.009
    mesh.rotateX(THREE.MathUtils.degToRad(-90))
    scene.add(mesh)
  }
}

// 路标
const createTrafficLabel = (scene: THREE.Scene) => {
  const coor = coordinateTransform(yuandian, datalaneguidearrow.data.features, 2)
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
    let material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    // mesh.position.x = - Math.PI / 2
    mesh.position.y = 0.01
    mesh.rotateX(THREE.MathUtils.degToRad(-90))
    scene.add(mesh)
  }
}

const createTrafficSideLine = (scene: THREE.Scene) => {
  const coor = coordinateTransform(yuandian, databoundaryline.data.features, 2)
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

let ownercar: THREE.Mesh;
let curve: THREE.CatmullRomCurve3;
// 创建自己车
const createOwnCar = (scene: THREE.Scene) => {
  //给方块添加材质
  const cubeGeometry = new THREE.BoxGeometry(10, 10, 50);
  const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0x9f00ff });
  ownercar = new THREE.Mesh(cubeGeometry, cubeMaterial);
  ownercar.position.y = 5
  ownercar.castShadow = true
  const axesHelper = new THREE.AxesHelper(100);
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
  if (ownercar) {

    curTime += (1000 / (fps.value || 60))
    const percent = curTime / TOTAL_TIME // 已运动百分比
    cPercent.value = percent
    // 获取当前百分比的点位数据
    const point = curve.getPoint(percent);
    // point.add(new THREE.Vector3(0, 5, 0))
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
</script>

<style scoped>
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