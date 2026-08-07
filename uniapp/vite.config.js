import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'
import { h5ChatApi } from './plugins/h5ChatApi.js'

export default defineConfig({
  root: 'src',
  plugins: [uni(), h5ChatApi()],
  define: {
    __LIFEAI_API_BASE_URL__: JSON.stringify(process.env.VITE_API_BASE_URL || ''),
  },
  server: {
    host: '0.0.0.0',
    port: 4000,
    proxy: {
      '/backend': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        timeout: 180000,
        proxyTimeout: 180000,
        rewrite: (path) => path.replace(/^\/backend/, ''),
      },
    },
  },
})
