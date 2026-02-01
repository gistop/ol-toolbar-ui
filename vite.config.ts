import { resolve } from 'path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

// 判断是否为构建模式（pnpm build）
// 检查命令行参数，如果包含 'build' 则认为是构建模式
const isBuild = process.argv.includes('build') || (process.env.NODE_ENV === 'production' && !process.env.VITE_DEV)

export default defineConfig(({ command }) => {
  // 如果是构建命令，使用库构建配置
  if (command === 'build' || isBuild) {
    return {
      root: '.', // 构建模式：使用项目根目录
      base: './',
      
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src')
        }
      },

      build: {
        outDir: resolve(__dirname, 'dist'), // 明确指定输出目录为项目根目录下的 dist
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'OlToolbarUI',
          fileName: (format) => `ol-toolbar.${format}.js`
        },
        rollupOptions: {
          // 不打包 peerDependencies
          external: ['vue', 'element-plus', 'ol', '@element-plus/icons-vue'],
          output: {
            globals: {
              vue: 'Vue',
              'element-plus': 'ElementPlus',
              ol: 'ol',
              '@element-plus/icons-vue': 'ElementPlusIconsVue'
            }
          }
        }
      },

      plugins: [
        vue(),
        dts({ insertTypesEntry: true, include: ['src'] })
      ]
    }
  }

  // 开发模式：以 demo 为入口
  return {
    root: 'demo',
    base: '/',

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },

    plugins: [vue()],

    server: {
      open: true,
      port: 3000
    }
  }
})