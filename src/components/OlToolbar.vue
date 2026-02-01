<template>
  <div class="ol-toolbar">
    <el-button-group>
      <el-button 
        type="primary" 
        size="small" 
        :icon="icons.zoomIn" 
        @click="handleZoomIn"
        :class="{ 'is-active': activeMode === 'zoomIn' }"
      >
        放大
      </el-button>
      <el-button 
        type="primary" 
        size="small" 
        :icon="icons.zoomOut" 
        @click="handleZoomOut"
        :class="{ 'is-active': activeMode === 'zoomOut' }"
      >
        缩小
      </el-button>
      <el-button type="success" size="small" :icon="icons.fullScreen" @click="handleFullScreen">
        全图
      </el-button>
      <el-button type="info" size="small" :icon="icons.refresh">
        刷新
      </el-button>
    </el-button-group>
    <p class="dev-hint">Toolbar 组件（开发中...）</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import Map from 'ol/Map'
import DragBox from 'ol/interaction/DragBox'
import DragPan from 'ol/interaction/DragPan'
import type { Component } from 'vue'

// 尝试导入默认图标（由于在 vite.config 中已经 external，运行时应该能从用户的 node_modules 中导入）
// 使用同步导入，构建时已经 external，运行时应该能正常导入
// 如果导入失败，将使用 props 传入的图标
import { ZoomIn, ZoomOut, FullScreen, Refresh } from '@element-plus/icons-vue'

const defaultZoomIn: Component | null = ZoomIn
const defaultZoomOut: Component | null = ZoomOut
const defaultFullScreen: Component | null = FullScreen
const defaultRefresh: Component | null = Refresh

// 定义 props
interface Props {
  map?: Map | null
  icons?: {
    zoomIn?: Component
    zoomOut?: Component
    fullScreen?: Component
    refresh?: Component
  }
}

const props = withDefaults(defineProps<Props>(), {
  map: null,
  icons: () => ({})
})

// 合并图标：优先使用 props 传入的，否则使用默认的
const icons = computed(() => ({
  zoomIn: props.icons?.zoomIn || defaultZoomIn,
  zoomOut: props.icons?.zoomOut || defaultZoomOut,
  fullScreen: props.icons?.fullScreen || defaultFullScreen,
  refresh: props.icons?.refresh || defaultRefresh
}))

// 当前激活的交互模式：'zoomIn' | 'zoomOut' | null
const activeMode = ref<'zoomIn' | 'zoomOut' | null>(null)

// 存储当前的 DragBox 交互实例
let dragBoxInteraction: DragBox | null = null

// 存储 DragBox 的事件处理函数引用（用于正确移除监听器）
let boxEndHandler: (() => void) | null = null

// 存储地图的拖拽交互实例（用于临时禁用/启用）
let dragPanInteraction: DragPan | null = null

// 激活拉框交互
const activateDragBox = (mode: 'zoomIn' | 'zoomOut') => {
  if (!props.map) {
    console.warn('OlToolbar: map 实例未传入')
    return
  }

  // 如果点击的是当前已激活的按钮，则取消激活
  if (activeMode.value === mode) {
    // 移除拉框交互
    if (dragBoxInteraction) {
      // 先取消激活交互
      dragBoxInteraction.setActive(false)
      // 移除事件监听器
      if (boxEndHandler) {
        dragBoxInteraction.un('boxend', boxEndHandler)
        boxEndHandler = null
      }
      // 从地图移除交互
      props.map.removeInteraction(dragBoxInteraction)
      dragBoxInteraction = null
    }
    // 恢复地图拖拽交互
    if (dragPanInteraction) {
      props.map.addInteraction(dragPanInteraction)
      dragPanInteraction = null
    }
    activeMode.value = null
    return
  }

  // 如果已经有激活的交互，先移除并恢复拖拽
  if (dragBoxInteraction) {
    // 先取消激活交互
    dragBoxInteraction.setActive(false)
    // 移除事件监听器
    if (boxEndHandler) {
      dragBoxInteraction.un('boxend', boxEndHandler)
      boxEndHandler = null
    }
    // 从地图移除交互
    props.map.removeInteraction(dragBoxInteraction)
    dragBoxInteraction = null
    // 恢复地图拖拽交互
    if (dragPanInteraction) {
      props.map.addInteraction(dragPanInteraction)
      dragPanInteraction = null
    }
  }

  // 临时禁用地图的拖拽交互
  const map = props.map!
  const interactions = map.getInteractions()
  interactions.forEach((interaction) => {
    if (interaction instanceof DragPan) {
      dragPanInteraction = interaction
      map.removeInteraction(interaction)
    }
  })

  // 创建新的 DragBox 交互
  dragBoxInteraction = new DragBox({
    condition: (event) => {
      // 只允许鼠标左键拖拽，并且当前模式必须匹配
      return event.originalEvent.button === 0 && activeMode.value === mode
    }
  })

  // 监听框选完成事件
  boxEndHandler = () => {
    const map = props.map!
    const view = map.getView()
    const extent = dragBoxInteraction!.getGeometry().getExtent()
    
    if (mode === 'zoomIn') {
      // 拉框放大：将框选区域适配到视图
      view.fit(extent, {
        padding: [50, 50, 50, 50],
        duration: 300
      })
    } else if (mode === 'zoomOut') {
      // 拉框缩小：计算当前视图范围，然后缩小使框选区域占满视图
      const mapSize = map.getSize()
      if (mapSize) {
        // 获取当前视图的地图坐标范围
        const currentExtent = view.calculateExtent(mapSize)
        const currentWidth = currentExtent[2] - currentExtent[0]
        const currentHeight = currentExtent[3] - currentExtent[1]
        const boxWidth = extent[2] - extent[0]
        const boxHeight = extent[3] - extent[1]
        
        // 计算框选区域相对于当前视图的比例
        const ratioX = boxWidth / currentWidth
        const ratioY = boxHeight / currentHeight
        const ratio = Math.max(ratioX, ratioY)
        
        // 如果框选区域小于当前视图，则缩小地图
        if (ratio < 1) {
          const currentZoom = view.getZoom() || 0
          // 计算需要缩小的缩放级别（使框选区域占满视图）
          const newZoom = currentZoom + Math.log2(ratio)
          view.animate({
            zoom: newZoom,
            center: view.getCenter(),
            duration: 300
          })
        } else {
          // 如果框选区域大于或等于当前视图，直接 fit（会放大）
          view.fit(extent, {
            padding: [50, 50, 50, 50],
            duration: 300
          })
        }
      }
    }
    
    // 框选完成后不移除交互，保持激活状态，可以继续框选
    // 只有点击其他按钮或再次点击同一按钮时才会取消激活
  }
  
  dragBoxInteraction.on('boxend', boxEndHandler)

  // 将交互添加到地图
  props.map.addInteraction(dragBoxInteraction)
  activeMode.value = mode
}

// 处理放大按钮点击
const handleZoomIn = () => {
  activateDragBox('zoomIn')
}

// 处理缩小按钮点击
const handleZoomOut = () => {
  activateDragBox('zoomOut')
}

// 全图功能
const handleFullScreen = () => {
  if (!props.map) {
    console.warn('OlToolbar: map 实例未传入')
    return
  }

  // 取消放大缩小的激活状态
  if (dragBoxInteraction) {
    // 先取消激活交互
    dragBoxInteraction.setActive(false)
    // 移除事件监听器
    if (boxEndHandler) {
      dragBoxInteraction.un('boxend', boxEndHandler)
      boxEndHandler = null
    }
    // 从地图移除交互
    props.map.removeInteraction(dragBoxInteraction)
    dragBoxInteraction = null
  }
  // 恢复地图拖拽交互
  if (dragPanInteraction) {
    props.map.addInteraction(dragPanInteraction)
    dragPanInteraction = null
  }
  // 重置激活状态
  activeMode.value = null

  const map = props.map
  const view = map.getView()
  const layers = map.getLayers()

  // 获取所有可见图层的范围
  const extents: number[][] = []

  layers.forEach((layer) => {
    if (layer.getVisible()) {
      const extent = layer.getExtent()
      if (extent) {
        extents.push(extent)
      } else {
        // 如果图层没有 extent，尝试从 source 获取
        if ('getSource' in layer && typeof (layer as any).getSource === 'function') {
          const source = (layer as any).getSource()
          if (source && typeof source.getExtent === 'function') {
            const sourceExtent = source.getExtent()
            if (sourceExtent) {
              extents.push(sourceExtent)
            }
          }
        }
      }
    }
  })

  // 如果没有找到任何 extent，使用默认的全球范围（适用于瓦片图层）
  if (extents.length === 0) {
    // 使用 Web Mercator 投影的全球范围
    const defaultExtent = [-20037508.34, -20037508.34, 20037508.34, 20037508.34]
    view.fit(defaultExtent, {
      padding: [50, 50, 50, 50],
      duration: 500,
      maxZoom: 18
    })
    return
  }

  // 计算合并后的范围
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  extents.forEach((extent) => {
    minX = Math.min(minX, extent[0])
    minY = Math.min(minY, extent[1])
    maxX = Math.max(maxX, extent[2])
    maxY = Math.max(maxY, extent[3])
  })

  const fullExtent = [minX, minY, maxX, maxY]

  // 缩放到全图范围，添加一些边距
  view.fit(fullExtent, {
    padding: [50, 50, 50, 50], // 上下左右各 50px 的边距
    duration: 500, // 动画时长 500ms
    maxZoom: 18 // 最大缩放级别
  })
}

// 组件卸载时清理交互
onUnmounted(() => {
  if (dragBoxInteraction && props.map) {
    props.map.removeInteraction(dragBoxInteraction)
  }
})
</script>

<style scoped>
.ol-toolbar {
  padding: 8px;
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  display: inline-block;
}

.dev-hint {
  margin-top: 6px;
  font-size: 12px;
  color: #909399;
}

.el-button.is-active {
  background-color: #66b1ff;
  border-color: #66b1ff;
}
</style>
