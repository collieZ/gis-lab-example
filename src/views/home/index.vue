<template>
  <div>
    <NDivider></NDivider>
    <NH2 prefix="bar" align-text>
      <NText type="success">
        四维 minemap
      </NText>
    </NH2>
    <ul class="btn-list">
      <li v-for="item in demoPages" :key="item.name">
        <NButton @click="handleClick(item.name)">{{ item.title }}</NButton>
      </li>
    </ul>
    <NDivider></NDivider>
    <NH2 prefix="bar" align-text>
      <NText type="success">
        MapLibre GL
      </NText>
    </NH2>
    <ul class="btn-list">
      <li v-for="item in maplibreExample" :key="item.name">
        <NButton @click="handleClick(item.name)">{{ item.title }}</NButton>
      </li>
    </ul>
    <NDivider></NDivider>
    <NH2 prefix="bar" align-text>
      <NText type="success">
        Threejs
      </NText>
    </NH2>
    <ul class="btn-list">
      <li v-for="item in threeExample" :key="item.name">
        <NButton @click="handleClick(item.name)">{{ item.title }}</NButton>
      </li>
    </ul>
    <NDivider></NDivider>
    <NH2 prefix="bar" align-text>
      <NText type="success">
        Cesium
      </NText>
    </NH2>
    <ul class="btn-list">
      <li v-for="item in cesiumExample" :key="item.name">
        <NButton @click="handleClick(item.name)">{{ item.title }}</NButton>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { NButton, NDivider, NH2, NText } from 'naive-ui'

const router = useRouter()

const demoPages = [
  {
    title: '0-基础',
    name: 'MinemapExample0'
  },
  {
    title: '1-图层',
    name: 'MinemapExample1'
  },
  {
    title: '2-timelinetest',
    name: 'MinemapExample2'
  },
]

const maplibreExample = [
  {
    title: '0-基础',
    name: 'MaplibreExample0'
  },
  {
    title: '1-bigscreen-test',
    name: 'MaplibreExample1'
  },
]

const threeExample = [
  {
    title: '0-three-轨迹漫游',
    name: 'ThreeExample0'
  },
  {
    title: '1-three-纹理贴图/UV 动画',
    name: 'ThreeExample1'
  },
  {
    title: '2-three-三维模型',
    name: 'ThreeExample2'
  },
  {
    title: '3-three-坐标转换（经纬度转笛卡尔坐标系2）',
    name: 'ThreeExample3'
  },
  {
    title: '4-three-场景标注标签',
    name: 'ThreeExample4'
  },
  {
    title: '5-three-相机视点验证',
    name: 'ThreeExample5'
  },
  {
    title: '6-three-相机视点验证（带场景）',
    name: 'ThreeExample6'
  },
  {
    title: '7-three-扩散涟漪效果',
    name: 'ThreeExample7'
  },
]

const cesiumExample = [
  {
    title: '0-基础',
    name: 'CesiumExample0'
  },
  {
    title: '1-entity',
    name: 'CesiumExample1'
  },
]


const dispatchEvent: Record<string, any> = {
  /** minemap */
  ...demoPages.reduce((pre, cur) => {
    pre[cur.name] = () => { router.push({ name: cur.name }) }
    return pre
  }, {} as any),
  /** minemap */
  ...maplibreExample.reduce((pre, cur) => {
    pre[cur.name] = () => { router.push({ name: cur.name }) }
    return pre
  }, {} as any),
  /** three */
  ...threeExample.reduce((pre, cur) => {
    pre[cur.name] = () => { router.push({ name: cur.name }) }
    return pre
  }, {} as any),
  /** cesium */
  ...cesiumExample.reduce((pre, cur) => {
    pre[cur.name] = () => { router.push({ name: cur.name })
      }
    return pre
  }, {} as any),
};

const handleClick = (type: string, data = {}) => {
  const func = dispatchEvent[type];
  func && typeof func === 'function' && func(data);
};
</script>

<style scoped>
.btn-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  list-style: none;
  padding: 0;
  margin: 0;
  gap: 10px;
}
</style>