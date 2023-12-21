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
import gsap from 'gsap'

import * as dat from "dat.gui";
import { onUnmounted } from 'vue';

const gui = new dat.GUI();


let controls: OrbitControls
let camera: THREE.PerspectiveCamera
const webglRef = ref(null)


function addCameraHelper(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
  const helper = new THREE.CameraHelper(camera)
  scene.add(helper)
}

const createCircleLoop = (scene: THREE.Scene) => {
  const yuanhuan = new THREE.Group();

  const vertexShader = `
        // 标准顶点着色器内容
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

  const fragmentShader = `
        varying vec2 vUv;
        uniform float gradientRadius;

        void main() {
            vec2 center = vec2(0.5, 0.5);
            float distance = length(vUv - center);

            float alpha = smoothstep(0.35, gradientRadius, distance);
            vec3 finalColor = mix(vec3(1.0, 0.0, 0.0), vec3(1.0), alpha);

            gl_FragColor = vec4(finalColor, alpha);
        }
    `;

  // 创建自定义着色器材质
  const uniforms = {
    gradientRadius: { value: 0.7 }
  };

  const geometry = new THREE.CircleGeometry(1.2, 128);
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    side: THREE.DoubleSide
  });

  const torus = new THREE.Mesh(geometry, material);
  yuanhuan.add(torus)
  yuanhuan.rotation.x = Math.PI / 2

  gsap.to(yuanhuan.scale, {
    x: 1.0,
    y: 1.2,
    duration: 2,
    yoyo: true,
    repeat: -1,
  });

  scene.add(yuanhuan)
}

const createCircleRippling = (scene: THREE.Scene) => {
  const yuanhuan = new THREE.Group();

  const vertexShader = `
      // 标准顶点着色器内容
      varying vec2 vUv;
      void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
  `;

  const fragmentShader = `
      varying vec2 vUv;
      uniform float gradientRadius;

      void main() {
          vec2 center = vec2(0.5, 0.5);
          float distance = length(vUv - center);

          float alpha = smoothstep(0.35, gradientRadius, distance);
          vec3 finalColor = mix(vec3(1.0, 0.0, 0.0), vec3(1.0), alpha);

          gl_FragColor = vec4(finalColor, alpha);
      }
  `;

  // 创建自定义着色器材质
  const uniforms = {
    gradientRadius: { value: 0.7 }
  };

  const geometry = new THREE.CircleGeometry(1.2, 128);
  const material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    side: THREE.DoubleSide
  });

  const geometry2 = new THREE.CircleGeometry(1.2, 128);
  const material2 = new THREE.ShaderMaterial({
    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
    opacity: 0
  });

  const torus = new THREE.Mesh(geometry, material);
  const torus2 = new THREE.Mesh(geometry2, material2);
  torus2.position.z = 0.02
  yuanhuan.add(torus)
  yuanhuan.add(torus2)
  yuanhuan.rotation.x = Math.PI / 2

  gsap.fromTo(torus.scale, { x: 0, y: 0 }, {
    x: 1.2,
    y: 1.2,
    duration: 2,
    repeat: -1
  });
  gsap.fromTo(torus2.scale, { x: 0, y: 0 }, {
    x: 1.2,
    y: 1.2,
    duration: 2,
    delay: 1.2,
    // yoyo: true,
    repeat: -1,
  });
  scene.add(yuanhuan)
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

  //告诉渲染器，我们需要阴影映射
  renderer.shadowMap.enabled = true;

  // 添加辅助坐标轴
  const axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  //创建stats对象
  const stats = new Stats();
  stats.setMode(0)
  document.body.appendChild(stats.domElement);

  // createCircleLoop(scene)
  createCircleRippling(scene)

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