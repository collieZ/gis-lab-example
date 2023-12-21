<template>
  <div ref="webglRef"></div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Stats from 'three/addons/libs/stats.module'
import { onMounted } from 'vue'
import { useEventListener } from '@vueuse/core'
import { throttle } from 'lodash-es'

import * as dat from "dat.gui";
import { onUnmounted } from 'vue';

const gui = new dat.GUI();


let controls: OrbitControls
let camera: THREE.PerspectiveCamera
const webglRef = ref(null)
let textureA: any
let textureDisp: any
let stats: any;


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
  controls = createControls()

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
  camera.lookAt(0 ,0, 0)

  //告诉渲染器，我们需要阴影映射
  renderer.shadowMap.enabled = true;

  // 添加辅助坐标轴
  // const axesHelper = new THREE.AxesHelper(500);
  // scene.add(axesHelper);

  //创建stats对象
  stats = new Stats();
  stats.setMode(0)
  document.body.appendChild(stats.domElement);

  const gridHelper = new THREE.GridHelper(300, 25, 0x004444, 0x004444);
  scene.add(gridHelper)

  const testContainer = testRoate()
  scene.add(testContainer)

  function animate() {
    stats.update();
    controls.update()
    // 使容器对象绕Y轴旋转
    // textureA && (textureA.offset.x += 0.005)
    // testContainer.rotation.y += 0.01;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();
}


const testRoate = () => {
  const cubeGeometry = new THREE.SphereGeometry(20, 10, 20);
  // cubeGeometry.translate(20, 0, 0)
  const textureLoader = new THREE.TextureLoader()
  // 漫反射 基础贴图
  // textureA = textureLoader.load('http://elpsycongroo7.cn:999/rock_embedded_concrete_wall_diff_4k.png')
  textureA = textureLoader.load('http://elpsycongroo7.cn:999/rock_embedded_concrete_wall_diff_4k.png')
  // 位移贴图 产生阻挡效果
  textureDisp = textureLoader.load('http://elpsycongroo7.cn:999/rock_embedded_concrete_wall_disp_4k.png')
  // 法线贴图 影响颜色照亮方式
  const textureNormal = textureLoader.load('http://elpsycongroo7.cn:999/rock_embedded_concrete_wall_nor_gl_4k.png')
  // ao 贴图 影响环境遮挡
  const textureAo = textureLoader.load('http://elpsycongroo7.cn:999/rock_embedded_concrete_wall_ao_4k.png')
  // rough 贴图 影响粗糙度
  const textureRough = textureLoader.load('http://elpsycongroo7.cn:999/rock_embedded_concrete_wall_rough_4k.png')
  const textureCombined = textureLoader.load('http://elpsycongroo7.cn:999/rock_embedded_concrete_wall_arm_4k.png')
  // 环境贴图
  const textureCubeEnv = new THREE.CubeTextureLoader().setPath('http://elpsycongroo7.cn:999/Standard-Cube-Map/').load(['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'])
  textureCubeEnv.colorSpace = THREE.SRGBColorSpace

  console.log(textureA.encoding, 'encoding');
  textureA.wrapS = THREE.RepeatWrapping
  textureA.wrapT = THREE.RepeatWrapping
  textureA.repeat.x = 2
  textureA.repeat.y = 2

  const cubeMaterial = new THREE.MeshPhysicalMaterial({
    map: textureA,
    normalMap: textureNormal,
    aoMap: textureCombined,
    roughnessMap: textureCombined,
    metalnessMap: textureCombined,
    // displacementMap: textureDisp, // 高度贴图提供更多细节、但是渲染消耗更多资源 首选法线贴图
    transparent: true,
    side: THREE.DoubleSide,
    metalness: 0.5,
    roughness: 0.5,
    envMap: textureCubeEnv,
    clearcoat: 1, // 清漆层
    clearcoatRoughness: 0.5, // 清漆层粗糙度
    transmission: 0.5, // 透光率
    ior: 1.5, // 折射率
    // displacementScale: 0.2
  });
  const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
  gui.add(cube.material, 'metalness', 0, 1)
  gui.add(cube.material, 'clearcoat', 0, 1).name('清漆层')
  gui.add(cube.material, 'clearcoatRoughness', 0, 1).name('清漆层粗糙度')
  gui.add(cube.material, 'transmission', 0.0, 1.0).name('透光率')
  gui.add(cube.material, 'ior', 1.0, 2.333).name('折射率')
  // 创建第二组 UV 以使环境光遮蔽在 three.js 中正常工作
  const geometry = cube.geometry;
  geometry.setAttribute('uv2', new THREE.BufferAttribute(geometry.attributes.uv.array, 2));
  cube.add(new THREE.AxesHelper(50))

  const group = new THREE.Group()
  // 创建容器对象
  var container = new THREE.Object3D();

  // 添加模型到容器
  // container.add(cube);
  // group.add(cube)
  cube.translateX(20)
  // cube.rotateY(Math.PI / 2);
  // 平移容器对象
  // container.position.set(20, 0, 20);
  // group.position.set(20, 0, 0);
  // group.rotation.z = Math.PI / 4; // 绕y轴旋转


  return cube
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