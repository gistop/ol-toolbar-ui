import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// 判断是否为构建模式（pnpm build）
const isBuild = process.env.NODE_ENV === 'production' && !process.env.VITE_DEV

export default defineConfig({
  // 开发模式：以 demo 为入口
  root: isBuild ? undefined : 'demo',
  base: isBuild ? './' : '/',

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  // 构建模式：打包 src/index.ts 为库
      build: isBuild
    ? {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'OlToolbarUI',
          fileName: (format) => `ol-toolbar.${format}.js`
        },
        rollupOptions: {
          // 不打包 peerDependencies
          external: ['vue', 'element-plus', 'ol'],
          output: {
            globals: {
              vue: 'Vue',
              'element-plus': 'ElementPlus',
              ol: 'ol'
            }
          }
        }
      }
    : undefined,

  plugins: [
    vue(),
    isBuild ? dts({ insertTypesEntry: true, include: ['src'] }) : null
  ].filter(Boolean),

  server: {
    open: true,
    port: 3000
  }
})