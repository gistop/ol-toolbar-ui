<template>
    <div style="padding: 20px; font-family: Arial, sans-serif">
      <h2>OpenLayers 工具栏组件 Demo</h2>
      
      <!-- 工具栏 -->
      <div style="margin-bottom: 20px">
        <OlToolbar :map="mapRef" />
      </div>
      
      <!-- 地图容器 -->
      <div id="map" style="width: 100%; height: 400px; border: 1px solid #ccc; margin-bottom: 20px"></div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { onMounted, ref } from 'vue'
  import Map from 'ol/Map'
  import View from 'ol/View'
  import TileLayer from 'ol/layer/Tile'
  import OSM from 'ol/source/OSM'
  import XYZ from 'ol/source/XYZ'
  import 'ol/ol.css'
  
  // 创建地图实例的引用
  const mapRef = ref<Map | null>(null)
  
  onMounted(() => {
    // 创建多个不同类型的图层用于测试
    
    // 1. OSM 底图
    const osmLayer = new TileLayer({
      source: new OSM(),
      properties: { name: 'OSM 底图' },
      visible: true
    })
  
    // 2. CartoDB Positron 底图（浅色风格）
    const cartoLayer = new TileLayer({
      source: new XYZ({
        url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        attributions: '© OpenStreetMap contributors © CARTO'
      }),
      properties: { name: 'CartoDB 浅色底图' },
      visible: false
    })
  
    // 3. Stamen Terrain 底图（地形风格）
    const stamenLayer = new TileLayer({
      source: new XYZ({
        url: 'https://stamen-tiles-{a-d}.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
        attributions: '© Stamen Design, © OpenStreetMap contributors'
      }),
      properties: { name: 'Stamen 地形图' },
      visible: false
    })
  
    // 4. OpenTopoMap 底图（地形图风格）
    const topoLayer = new TileLayer({
      source: new XYZ({
        url: 'https://{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
        attributions: '© OpenStreetMap contributors, SRTM | Map style: © OpenTopoMap (CC-BY-SA)'
      }),
      properties: { name: 'OpenTopoMap 地形图' },
      visible: false
    })
  
    // 初始化 OpenLayers 地图
    mapRef.value = new Map({
      target: 'map',
      layers: [
        osmLayer,      // 默认显示的底图
        cartoLayer,    // 可切换的浅色底图
        stamenLayer,   // 可切换的地形图
        topoLayer      // 可切换的地形图
      ],
      view: new View({
        center: [116.3974, 39.9093], // 北京坐标
        zoom: 4
      })
    })
  })
  </script>