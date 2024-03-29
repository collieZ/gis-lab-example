<template>
  <div ref="webglRef"></div>
  <div class="tip-board">
    <NButton type="primary" @click="doExploder">拆解</NButton>
    <NButton type="primary" @click="doUnexplode">复原</NButton>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onMounted } from 'vue'
import { useEventListener } from '@vueuse/core'
import { throttle } from 'lodash-es'
import * as THREE from 'three'

import { NTag, NButton } from 'naive-ui'
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from 'three/addons/libs/stats.module'
// 引入gltf模型加载库GLTFLoader.js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader';
import { OBJLoader } from 'three/addons/loaders/OBJLoader';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader';
import Exploder from '@/utils/exploder'


import * as dat from "dat.gui";
import { onUnmounted } from 'vue';

const gui = new dat.GUI();
let stats: any;


let exploder: Exploder;
let controls: OrbitControls
let camera: THREE.PerspectiveCamera
const webglRef = ref(null)

const doExploder = () => {
  console.log(exploder, 'exploder');
  exploder?.explode();
}

const doUnexplode = () => {
  exploder?.unexplode();
}


function addCameraHelper(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const helper = new THREE.CameraHelper(camera)
  scene.add(helper)
}

const initScene = () => {
  /** 1. 创建一个场景 */
  const scene = new THREE.Scene()

  /** 2. 创建一个相机 */
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000)
  // addCameraHelper(scene, camera)

  /** 3. 创建渲染器 */
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, precision: 'highp', alpha: true, logarithmicDepthBuffer: true })
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 添加渲染器canvas元素
  (webglRef.value as unknown as HTMLDivElement).appendChild(renderer.domElement);
  renderer.setClearColor('#fff');

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
    light = new THREE.SpotLight(0xffffff, 999);
    light.position.set(0, 20, 0); //default; light shining from top
    light.castShadow = true; // default false
    light.target = scene
    light.name = "SpotLight"
    gui.add(light, 'intensity').min(0).max(1000).step(1).name('SpotLight')
    scene.add(light);
    let light2 = new THREE.AmbientLight(0xffffff, 0.1)
    light2.position.set(0, 40, 0);
    gui.add(light2, 'intensity').min(0).max(1000).step(0.5)
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

  /**
   * 6. 加载模型
   */
  window.threecamera = camera.position
  const gltfLoader = new GLTFLoader()
  const dRACOLoader = new DRACOLoader()
  gltfLoader.setDRACOLoader(dRACOLoader)
  dRACOLoader.setDecoderPath('/draco/')
  gltfLoader.load('/models/JiQi.glb', function (gltf) {
    // console.log(gltf, 'ggggg');
    // gltf.scene.scale.set(500, 500, 500)
    // gltf.scene.traverse(function (obj) {
    //   if (obj.isMesh) {
    //     // 模型材质重新设置
    //     // obj.material = new THREE.MeshLambertMaterial({
    //     //   color: 0x004444,
    //     //   transparent: true,
    //     //   opacity: 0.5,
    //     // });
    //     // 模型边线设置
    //     const edges = new THREE.EdgesGeometry(obj.geometry);
    //     const edgesMaterial = new THREE.LineBasicMaterial({
    //       color: 0x00ffff,
    //     })
    //     const line = new THREE.LineSegments(edges, edgesMaterial);
    //     obj.add(line);
    //   }
    // });
    // gltf.scene.scale.set(500, 500, 500)
    scene.add(gltf.scene);
    exploder = new Exploder(scene, gltf.scene.id, null, 1) // 初始化拆解
    gltf.scene.position.set(0, -0.64, 0) 
  },
    // called while loading is progressing
    function (xhr) {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded gltf');
    },
    // called when loading has errors
    function (error) { 
      console.log('An error happened', error);
    })

                       
  camera.position.x = 0; // 相机移动一点，防止和物体重合
  camera.position.z = 2; // 相机移动一点，防止和物体重合
  camera.position.y = 0.5; // 相机移动一点，防止和物体重合


  //告诉渲染器，我们需要阴影映射
  renderer.shadowMap.enabled = true;

  // 添加辅助坐标轴
  const axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  //创建stats对象
  stats = new Stats();
  stats.setMode(0)
  document.body.appendChild(stats.domElement);


  function animate() {
    stats.update();
    controls.update()
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
}
</style>