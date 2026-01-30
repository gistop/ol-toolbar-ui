<template>
  <div class="ol-toolbar">
    <el-button-group>
      <el-button type="primary" size="small" :icon="ZoomIn">
        放大
      </el-button>
      <el-button type="primary" size="small" :icon="ZoomOut">
        缩小
      </el-button>
      <el-button type="success" size="small" :icon="FullScreen" @click="handleFullScreen">
        全图
      </el-button>
      <el-button type="info" size="small" :icon="Refresh">
        刷新
      </el-button>
    </el-button-group>
    <p class="dev-hint">Toolbar 组件（开发中...）</p>
  </div>
</template>

<script setup lang="ts">
import Map from 'ol/Map'
import { ZoomIn, ZoomOut, FullScreen, Refresh } from '@element-plus/icons-vue'

// 定义 props
interface Props {
  map?: Map | null
}

const props = withDefaults(defineProps<Props>(), {
  map: null
})

// 全图功能
const handleFullScreen = () => {
  if (!props.map) {
    console.warn('OlToolbar: map 实例未传入')
    return
  }

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
</style>
