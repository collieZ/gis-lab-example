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
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { CSS3DObject } from 'three/addons/renderers/CSS3DRenderer';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CSS3DRenderer, CSS3DSprite } from 'three/addons/renderers/CSS3DRenderer';

/**
 * css2D css3D 精灵图 css3D精灵图 标签标注
 */


const gui = new dat.GUI();
let stats: any;

let controls: OrbitControls
let camera: THREE.PerspectiveCamera
const webglRef = ref(null)


function addCameraHelper(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const helper = new THREE.CameraHelper(camera)
  scene.add(helper)
}

const createMesh = (scene: THREE.Scene) => {
  const geometry = new THREE.BoxGeometry(8, 10, 20)
  const meterial = new THREE.MeshBasicMaterial({color: '#66c'})
  const mesh = new THREE.Mesh(geometry, meterial)
  mesh.position.set(0, 0, 0)
  scene.add(mesh)
  return mesh
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
  const createControls = (dom = renderer.domElement): OrbitControls => {
    const controls = new OrbitControls(camera, dom);
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
  stats = new Stats();
  stats.setMode(0)
  document.body.appendChild(stats.domElement);

  const meshA = createMesh(scene)

  // 加载 html 对象到 three 中
  const div = document.createElement('div');
  div.innerHTML = '这是一个html标签'
  div.style.width = '30px'
  div.style.display = 'none'
  div.style.height = '24px'
  div.style.fontSize = '12px'
  div.style.backgroundColor = '#66ccff'
  // HTML元素转化为threejs的CSS2模型对象
  // const tag = new CSS2DObject(div);
  const tag = new CSS3DSprite(div);
  // const tag = new CSS3DObject(div);
  tag.position.set(-20, 0, 0);
  div.style.pointerEvents = 'none';
  onUnmounted(() => {
    div.remove()
  })
  gui.add(tag.position, 'x').name('x')
  gui.add(tag.position, 'y').name('y')
  gui.add(tag.position, 'z').name('z')
  const groups = new THREE.Group()
  // groups.add(tag)
  // scene.add(groups);
  meshA.add(tag)

  const css2Renderer = new CSS3DRenderer();
  // const css2Renderer = new CSS3DSprite();
  // const css2Renderer = new CSS2DRenderer();
  css2Renderer.setSize(window.innerWidth, window.innerHeight);
  css2Renderer.domElement.style.position = 'absolute';
  css2Renderer.domElement.style.top = '0px';
  css2Renderer.domElement.style.pointerEvents = 'none'; // 防止 div 阻挡鼠标等事件

  document.body.appendChild(css2Renderer.domElement);

  controls = createControls()

  camera.position.set(0, 20, -25)
  camera.lookAt(meshA.position)

  function animate() {
    stats.update();
    controls.update()
    camera.lookAt(meshA.position)
    if(meshA.position.z <= 300) {
      meshA.position.z += 0.5
      camera.position.z += 0.5
      // groups.position.z += 0.5
    } else {
      meshA.position.z = 0
      camera.position.z = -40
      // groups.position.z = 0
    }
    renderer.render(scene, camera);
    css2Renderer.render(scene, camera);
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