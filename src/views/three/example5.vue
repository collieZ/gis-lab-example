<template>
  <div>
    <div ref="webglRef"></div>
    <div class="tip-board">
      <NButton type="primary" @click="stop">停止</NButton>
  
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
import { NButton, NSwitch, NSpace } from 'naive-ui'
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from 'three/addons/libs/stats.module'
import { onMounted } from 'vue'
import { useEventListener } from '@vueuse/core'
import { throttle, random } from 'lodash-es'
import gsap from 'gsap';

import * as dat from "dat.gui";
import { onUnmounted } from 'vue';

const gui = new dat.GUI();

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

let controls: OrbitControls
let camera: THREE.PerspectiveCamera
let viewPoint: THREE.Mesh
const webglRef = ref(null)

const createViewPoint = () => {
  viewPoint = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5
    })
  )
  return viewPoint
  // scene.add(viewPoint)
}

const createCar = (scene: THREE.Scene) => {
  const viewPoint = createViewPoint()
  viewPoint.position.set(0, 10, 30)

  const car = new THREE.Mesh(
    new THREE.BoxGeometry(10, 10, 30),
    new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.8
    })
  )

  car.add(viewPoint)
  scene.add(car)
  return car
}

const bindCamera = (car: THREE.Mesh, camera: THREE.PerspectiveCamera) => {
  car.add(camera)
  camera.position.set(0, 30, -50)
}

const swingCamera = (camera: THREE.PerspectiveCamera) => {
clearInterval(t1)
 t1 = setInterval(() => {
    gsap.to(camera.position, {
      x: random(-5, 5),
      y: random(-5, 5) + 30,
      z: random(-5, 5) + -50,
      duration: 0.5
    })
    // camera.position.set(0 + random(-5, 5), 30 + random(-5, 5), -50 + random(-5, 5))
  }, 700)
}

const swingViewPoint = () => {
  clearInterval(t2)
  t2 = setInterval(() => {
    gsap.to(viewPoint.position, {
      x: random(-5, 5),
      y: random(-5, 5) + 10,
      z: random(-5, 5) + 30,
      duration: 0.5
    })
    // viewPoint.position.set(0 + random(-5, 5), 10 + random(-5, 5), 30 + random(-5, 5))
  }, 700)
}


function addCameraHelper(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const helper = new THREE.CameraHelper(camera)
  scene.add(helper)
}

const initScene = () => {
  /** 1. 创建一个场景 */
  const scene = new THREE.Scene()

  /** 2. 创建一个相机 */
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 10000)
  // addCameraHelper(scene, camera)

  /** 3. 创建渲染器 */
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, precision: 'highp', alpha: true, logarithmicDepthBuffer: true })
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 添加渲染器canvas元素
  (webglRef.value as unknown as HTMLDivElement).appendChild(renderer.domElement);
  // renderer.setClearColor('#B4D3BA');

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
  // controls = createControls()

  /**
   * 5. 创建光源
   */
  let light: THREE.SpotLight;
  const createLight = () => {
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
  })

  camera.position.z = 80; // 相机移动一点，防止和物体重合
  camera.position.y = 800; // 相机移动一点，防止和物体重合

  //告诉渲染器，我们需要阴影映射
  renderer.shadowMap.enabled = true;

  // 添加辅助坐标轴
  const axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  //创建stats对象
  const stats = new Stats();
  stats.setMode(0)
  document.body.appendChild(stats.domElement);

  const carBox = createCar(scene)
  bindCamera(carBox, camera)


  // swingCamera(camera)
  // swingViewPoint()

  function animate() {
    const lookAtPos = new THREE.Vector3()
    viewPoint.getWorldPosition(lookAtPos)
    camera.lookAt(lookAtPos)
    stats.update();
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
})
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