<template>
    <div class="ol-toolbar">
      <el-button-group>
        <el-button type="primary" size="small" :icon="ZoomIn">
          放大
        </el-button>
        <el-button type="primary" size="small" :icon="ZoomOut">
          缩小
        </el-button>
        <el-button type="success" size="small" :icon="FullScreen">
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
  // 图标从 Element Plus 引入（推荐方式）
  import { ZoomIn, ZoomOut, FullScreen, Refresh } from '@element-plus/icons-vue'
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