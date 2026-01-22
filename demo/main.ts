import { createApp } from 'vue'
import App from './App.vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// ⚠️ 关键：直接引用你正在开发的组件源码（非打包版）
import OlToolbar from '../src/index'

const app = createApp(App)
app.use(ElementPlus)
app.component('OlToolbar', OlToolbar)
app.mount('#app')