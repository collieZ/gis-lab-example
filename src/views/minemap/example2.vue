<template>
  <Teleport to="body">
    <div class="progress-container">
      <div class="progress-bar">
        <div class="progress-bar_active"></div>
        <div class="progress-bar_unactive"></div>
        <div class="progress-slider">
          <div ref="tooltipRef" v-show="isDragging && showToolTip" class="slider-tooltip"
            :style="{ left: tooltipOffset + 'px' }">
            <span>{{ tooltipCurrentTime }}</span>
          </div>
          {{ sliderText }}
        </div>
        <div class="progress-scale">
          <span ref="scaleItemRef" class="scale-item"
            :style="{ left: `calc(${item.per} + ${pointItemOffset - scaleItemOffset}px)` }"
            v-for="(item, index) of scalePerSet" :key="index" @click="handleScaleItemClick(item)">{{
              item.text }}</span>
        </div>
        <div class="progress-scale-point">
          <div class="point-item" :style="{ left: `calc(${item.per} + ${pointItemOffset}px)` }"
            v-for="(item, index) of scalePerSet" :key="index"></div>
        </div>
      </div>
    </div>
  </Teleport>
  <div class="test">
    <el-date-picker v-model="value1" type="datetime" size="large" :disabled-date="disableDateFn" placeholder="选择时间"
      @visible-change="handleDateVisibleChange" @change="handleDateChange" :disabled-hours="disabledHours"
      :disabled-minutes="disabledMinutes" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, withDefaults } from 'vue'
import { useRafFn, useFps } from '@vueuse/core'
import { ElDatePicker } from "element-plus"
import dayjs from 'dayjs';
import { Ref } from 'vue';
import { watch } from 'vue';

type TimeLineOptions = {
  startTime: string;
  endTime: string;
}

withDefaults(defineProps<{ showToolTip?: boolean }>(), {
  showToolTip: true
})


const emits = defineEmits<{ (e: 'progressChange', time: number): void }>()

/** test */
const value1 = ref('')
const cDate = ref(dayjs())
const handleDateVisibleChange = () => {
  cDate.value = dayjs()
}

const handleDateChange = (date: string) => {
  console.log(date, 'change!!');
  setTimeout(() => {
    reInitTimeLine(dayjs(date).format('YYYY-MM-DD HH:mm:ss'), dayjs(date).add(1, "days").format('YYYY-MM-DD HH:mm:ss'))
  }, 500);
}

const disableDateFn = (date: Date) => {
  const cTime = cDate.value
  const preOneMonthTime = cTime.subtract(1, 'month')
  // console.log(dayjs(date).format('YYYY-MM-DD'), 'dadada', dayjs(cTime).format('YYYY-MM-DD'), 'pre==>', preOneMonthTime.format('YYYY-MM-DD'));
  if (dayjs(date).isBefore(preOneMonthTime) || dayjs(date).isAfter(cTime)) {
    return true
  }
  return false
}

// time disable 当天当前时间往前推 1 分钟
const makeRange = (start: number, end: number) => {
  const result: number[] = []
  for (let i = start; i <= end; i++) {
    result.push(i)
  }
  result.shift()
  return result
}
const disabledHours = () => {
  if (dayjs().isSame(dayjs(value1.value), 'date')) {
    return makeRange(dayjs().get('hours'), 23)
  } else {
    return []
  }
}
const disabledMinutes = (hour: number) => {
  if (dayjs().isSame(dayjs(value1.value), 'date') && hour === dayjs().get('hours')) {
    return makeRange(dayjs().subtract(5, 'minutes').get("minutes"), 59)
  } else {
    return []
  }
}
/** ===== test end ===== */

let progressBar: HTMLElement
let progressSlider: HTMLElement
let progressSliderActive: HTMLElement
let progressSliderUnActive: HTMLElement

let reInitTimeLine: (sTime: string, eTime: string) => void;
const fps = useFps()
const sliderText = ref('')
const scalePerSet: Ref<{ per: string, text: string, time: number }[]> = ref([]) // 刻度标签、点位集合
const scaleItemRef = ref()
const scaleItemOffset = ref(0) // 刻度标签偏移量
const pointItemOffset = ref(0) // 刻度点位偏移量
watch(scaleItemRef, (r) => {
  if (r) {
    scaleItemOffset.value = (r[0] as HTMLElement).offsetWidth / 2
  }
})

let currentTime: number
const isDragging = ref(false);

// tooltip
const tooltipRef = ref()
const tooltipOffset = ref(0)
const tooltipCurrentTime = ref('')
watch(tooltipRef, (tooltip) => {
  if (tooltip) {
    const computedStyle = window.getComputedStyle(tooltip);
    const width = computedStyle.getPropertyValue('width');
    tooltipOffset.value = -(parseInt(width, 10) / 2 - progressSlider.offsetWidth / 2)
  }
})

let refreshFn = () => { } // 更新滑块位置
const { pause, resume } = useRafFn(() => {
  refreshFn()
})
pause()

onMounted(() => {
  const { simulatePlayback } = initTimeLine({
    startTime: '2023-09-13 10:00:00',
    endTime: '2023-09-13 12:00:00',
  })
  refreshFn = simulatePlayback
  resume()
})


const initTimeLine = (options: TimeLineOptions) => {
  progressBar = document.querySelector('.progress-bar') as HTMLElement;
  progressSlider = document.querySelector('.progress-slider') as HTMLElement;
  progressSliderActive = document.querySelector('.progress-bar_active') as HTMLElement;
  progressSliderUnActive = document.querySelector('.progress-bar_unactive') as HTMLElement;
  const maxW = progressBar.offsetWidth - progressSlider.offsetWidth

  if (!progressSlider || !progressBar) {
    throw new Error('progress-slider or progressBar is null')
  }

  // 解析时间字符串为时间戳（以秒为单位）
  let startTime = dayjs(options.startTime).valueOf() / 1000;
  let endTime = dayjs(options.endTime).valueOf() / 1000;
  currentTime = startTime;

  // 初始化进度条
  progressSlider.style.left = '0%';

  // 初始化刻度
  pointItemOffset.value = progressSlider.offsetWidth / 2 // 刻度点位偏移量
  const hourlyTimestamps = findHourlyTimestamps(options.startTime, options.endTime)

  // 生成刻度数组，包含位置，时间, 文字等信息
  const generateScalePos = (hourlyTimestamps: number[]) => {
    const scale = hourlyTimestamps.map((timestamp) => {
      let percent = (timestamp / 1000 - startTime) / (endTime - startTime) * 100
      const per = percent < 0 ? "-1" : `${percent * maxW / progressBar.offsetWidth}%`
      return { per, text: dayjs(timestamp).format('HH:mm'), time: timestamp };
    }).filter((v) => v.per !== '-1')
    return scale
  }
  scalePerSet.value = generateScalePos(hourlyTimestamps)
  console.log(scalePerSet, 'scalePerSetscalePerSet', hourlyTimestamps);

  // timeline 重新初始化函数
  reInitTimeLine = (sTime: string, eTime: string) => {
    startTime = dayjs(sTime).valueOf() / 1000;
    endTime = dayjs(eTime).valueOf() / 1000;
    currentTime = startTime;

    progressSlider.style.left = '0%';
    // pointItemOffset.value = progressSlider.offsetWidth / 2 // 刻度点位偏移量
    const hourlyTimestamps = findHourlyTimestamps(sTime, eTime)
    scalePerSet.value = generateScalePos(hourlyTimestamps)
  }

  // 正常播放时，更新进度条位置
  const playbackSpeed = computed(() => 1 / (fps.value || 60)); // 播放速度

  // 没拖动时，每帧更新滑块位置
  function simulatePlayback() {
    if (!isDragging.value && currentTime <= endTime) {
      currentTime += playbackSpeed.value;
      updateTimeScale()
      currentTime = Math.max(startTime, Math.min(currentTime, endTime))
      if (currentTime * 1000 > dayjs().valueOf()) {
        currentTime = dayjs().valueOf() / 1000
      }
      sliderText.value = dayjs(currentTime * 1000).format('HH:mm');
      calcUnactiveProgress()
      updateProgressBar(currentTime);
    }
  }

  // 更新播放进度条
  const updateTimeScale = () => {
    // 当前距坐标结束时间小于1分钟
    console.log(dayjs(endTime * 1000).format('YYYY-MM-DD HH:mm:ss'), dayjs(currentTime * 1000).format('YYYY-MM-DD HH:mm:ss'), 'jhjjhjhj');
    if (endTime * 1000 - currentTime * 1000 <= 1000 * 60 * 1) {
      // 开始时间加上x分钟，结束时间加上x分钟
      startTime = dayjs(startTime * 1000).add(1, 'hours').valueOf() / 1000;
      endTime = dayjs(endTime * 1000).add(1, 'hours').valueOf() / 1000;
      const hourlyTimestamps = findHourlyTimestamps(dayjs(startTime * 1000).format('YYYY-MM-DD HH:mm:ss'), dayjs(endTime * 1000).format('YYYY-MM-DD HH:mm:ss'))
      scalePerSet.value = generateScalePos(hourlyTimestamps)
    }
  }



  // 根据时间戳更新滑块位置
  function updateProgressBar(currentTime: number) {
    const percent = ((currentTime - startTime) / (endTime - startTime)) * 100;
    progressSliderActive.style.width = maxW * percent / 100 + 'px'
    progressSlider.style.left = `${percent * maxW / progressBar.offsetWidth}%`;
  }

  // 根据滑块位置计算时间戳
  function calculateTimeFromSliderPosition(mouseX: number) {
    let percent = (mouseX / (maxW)) * 100;
    return startTime + (percent / 100) * (endTime - startTime);
  }

  // 计算不可拖动时间段进度条位置
  const calcUnactiveProgress = () => {
    if(dayjs().isBefore(dayjs(endTime * 1000)) && dayjs().isAfter(dayjs(startTime * 1000))) {
      const percent = ((dayjs().valueOf() / 1000 - startTime) / (endTime - startTime));
      console.log(percent, 'uncative', 1- percent);
      // progressSliderUnActive.style.left = `${(1 - percent) * maxW / progressBar.offsetWidth}%`
      progressSliderUnActive.style.width = progressSlider.offsetWidth / 2 + maxW *  (1- percent) + 'px'
    } else {
      // progressSliderUnActive.style.left = `${(1 - percent) * maxW / progressBar.offsetWidth}%`
      progressSliderUnActive.style.width = '0%'
    }
    
  }

  let dragStartX = 0; // 开始拖拽点击位置
  let offset = 0 // 鼠标点击拖拽滑块偏移量，用于磨平误差
  // 监听拖动事件
  progressSlider.addEventListener('mousedown', (e) => {
    const rect = progressSlider.getBoundingClientRect();
    isDragging.value = true;
    dragStartX = e.clientX
    offset = dragStartX - rect.left
    // tooltipCurrentTime.value = dayjs(currentTime * 1000).format('YYYY-MM-DD HH:mm:ss')
  });

  document.addEventListener('mousemove', (e) => {
    e.preventDefault();
    if (!isDragging.value) return;
    const rect = progressBar.getBoundingClientRect();
    let mouseX = e.clientX - rect.left - offset;
    mouseX = Math.max(0, Math.min(maxW, mouseX));

    currentTime = calculateTimeFromSliderPosition(mouseX);
    if (currentTime * 1000 > dayjs().valueOf()) {
      console.warn('播放进度不可超过当前时间!')
      return
    }

    progressSlider.style.left = `${mouseX / progressBar.clientWidth * 100}%`;
    progressSliderActive.style.width = mouseX + 'px'

    tooltipCurrentTime.value = dayjs(currentTime * 1000).format('YYYY-MM-DD HH:mm:ss')
  });

  document.addEventListener('mouseup', (e) => {
    if (isDragging.value) {
      document.onmousemove = null;
      document.onmouseup = null;

      const rect = progressBar.getBoundingClientRect();
      let mouseX = e.clientX - rect.left - offset;
      mouseX = Math.max(0, Math.min(maxW, mouseX));

      const currentTime = calculateTimeFromSliderPosition(mouseX);
      emits('progressChange', currentTime * 1000)
      isDragging.value = false;
      console.log(`播放进度已更新为 ${dayjs(currentTime * 1000).format('YYYY-MM-DD HH:mm:ss')}`, currentTime);
    }
  });

  return {
    simulatePlayback
  }
}

// 查找整点小时的时间戳
function findHourlyTimestamps(startTime: string, endTime: string) {
  const timestamps = [];
  const startDateTime = dayjs(startTime);
  const endDateTime = dayjs(endTime);

  let currentDateTime = startDateTime.startOf('hour');

  while (currentDateTime.isBefore(endDateTime) || currentDateTime.isSame(endDateTime)) {
    timestamps.push(currentDateTime.valueOf());
    currentDateTime = currentDateTime.add(1, 'hour');
  }

  return timestamps;
}

// 抛出点击的坐标时间戳
const handleScaleItemClick = (item: { per: string, text: string, time: number }) => {
  currentTime = item.time / 1000
  emits('progressChange', currentTime * 1000)
}
</script>

<style lang="scss" scoped>
.progress-container {
  width: 70%;
  height: 90px;
  position: absolute;
  left: 50%;
  bottom: 50px;
  z-index: 99;
  background-image: linear-gradient(180deg, #16485bb3 0%, #001135b3 100%);
  border-radius: 10px;
  backdrop-filter: blur(10px);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 26.3px;
  touch-action: none;
  user-select: none;

  transform: translateX(-50%);

  // overflow: hidden;
}

.progress-bar {
  height: 21px;
  width: 100%;
  position: relative;
  top: -10px;
  background: #091424;
}

.progress-bar_active {
  position: absolute;
  height: 15.5px;
  width: 0;
  background-image: linear-gradient(90deg, #53ABFF 1%, #0069FF 100%);
  top: 50%;
  transform: translateY(-50%);
  z-index: 100;
}

.progress-bar_unactive {
  position: absolute;
  height: 15.5px;
  width: 0%;
  background-color: #333;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 100;
}

.progress-slider {
  width: 72px;
  height: 32px;
  line-height: 32px;
  text-align: center;
  background: #2268FF;
  box-shadow: 0 6px 14px 0 #00000080;
  border-radius: 4px;
  position: absolute;
  cursor: pointer;

  font-weight: 400;
  font-size: 20px;
  color: #FFFFFF;
  letter-spacing: 0;

  margin-top: -4px;
  user-select: none;
  outline: none;
  will-change: auto;
  z-index: 102;
}

.progress-scale {
  width: 100%;

  .scale-item {
    position: absolute;
    bottom: -40px;
    font-weight: 400;
    font-size: 20px;
    color: #FFFFFF;
    letter-spacing: 0;
    cursor: pointer;
  }
}

.progress-scale-point {
  width: 100%;

  .point-item {
    position: absolute;
    z-index: 99;
    top: 50%;
    transform: translateY(-50%);
    width: 5.81px;
    height: 5.33px;
    background: #36415F;
    border-radius: 50%;
    cursor: pointer;
  }
}

.slider-tooltip {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 260px;
  height: 80px;
  position: absolute;
  // left: -50%;
  top: -120px;
  z-index: 110;

  background-color: rgba(85, 83, 83, 0.5);
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: rgba(14, 14, 14, 0.19) 0px 6px 15px 0px;
  border-radius: 10px;
  color: #fff;
}


.test {
  position: absolute;
  top: 5vh;
  left: 3vw;
  z-index: 100;
}
</style>