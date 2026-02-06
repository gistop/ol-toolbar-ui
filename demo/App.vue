<template>
  <div style="padding: 20px; font-family: Arial, sans-serif">
    <h2>OpenLayers 工具栏组件 Demo</h2>

    <!-- 方式一：Vue 组件封装 -->
    <h3>方式一：Vue 组件封装（适用于 Vue3 + Element Plus 项目）</h3>
    <div style="margin-bottom: 12px; font-size: 13px; color: #666">
      通过 Vue 组件方式集成，适合前端是 Vue3 的项目，直接使用 Element Plus 按钮样式。
    </div>

    <div style="margin-bottom: 12px">
      <OlToolbar :map="mapRef" />
    </div>

    <div
      id="map"
      style="width: 100%; height: 320px; border: 1px solid #ccc; margin-bottom: 30px"
    ></div>

    <!-- 方式二：OpenLayers Control 封装 -->
    <h3>方式二：OpenLayers Control 封装（适用于任意框架或原生项目）</h3>
    <div style="margin-bottom: 12px; font-size: 13px; color: #666">
      通过 OpenLayers Control 方式集成，不依赖 Vue，也不依赖 Element Plus，仅需 OpenLayers 本身。
      工具栏会作为地图控件出现在地图内。
    </div>

    <div
      id="map-control"
      style="width: 100%; height: 320px; border: 1px solid #ccc"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import XYZ from 'ol/source/XYZ'
import 'ol/ol.css'

import { OlToolbarControl } from '../src'

// Vue 组件方式使用的地图实例
const mapRef = ref<Map | null>(null)

// Control 方式使用的地图与控件实例（无需响应式）
let controlMap: Map | null = null
let toolbarControl: OlToolbarControl | null = null

onMounted(() => {
  // 方式一：Vue 组件封装使用的地图
  const osmLayer = new TileLayer({
    source: new OSM(),
    properties: { name: 'OSM 底图' },
    visible: true
  })

  const cartoLayer = new TileLayer({
    source: new XYZ({
      url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
      attributions: '© OpenStreetMap contributors © CARTO'
    }),
    properties: { name: 'CartoDB 浅色底图' },
    visible: false
  })

  const stamenLayer = new TileLayer({
    source: new XYZ({
      url: 'https://stamen-tiles-{a-d}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
      attributions: '© Stamen Design, © OpenStreetMap contributors'
    }),
    properties: { name: 'Stamen 地形图' },
    visible: false
  })

  const topoLayer = new TileLayer({
    source: new XYZ({
      url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attributions:
        '© OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
    }),
    properties: { name: 'OpenTopoMap 地形图' },
    visible: false
  })

  mapRef.value = new Map({
    target: 'map',
    layers: [osmLayer, cartoLayer, stamenLayer, topoLayer],
    view: new View({
      center: [116.3974, 39.9093], // 北京
      zoom: 4
    })
  })

  // 方式二：Control 封装使用的地图
  controlMap = new Map({
    target: 'map-control',
    layers: [
      new TileLayer({
        source: new OSM()
      })
    ],
    view: new View({
      center: [116.3974, 39.9093],
      zoom: 4
    })
  })

  toolbarControl = new OlToolbarControl()
  controlMap.addControl(toolbarControl)
})

onBeforeUnmount(() => {
  if (controlMap && toolbarControl) {
    controlMap.removeControl(toolbarControl)
    toolbarControl = null
  }
  controlMap = null
})
</script>