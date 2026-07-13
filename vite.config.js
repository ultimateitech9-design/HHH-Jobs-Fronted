import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const manualChunks = (id) => {
  const normalizedId = id.replace(/\\/g, '/')
  if (!normalizedId.includes('/node_modules/')) return undefined

  if (
    normalizedId.includes('/react/') ||
    normalizedId.includes('/react-dom/') ||
    normalizedId.includes('/react-router-dom/') ||
    normalizedId.includes('/@remix-run/router/') ||
    normalizedId.includes('/react-helmet-async/')
  ) {
    return 'vendor-react'
  }

  if (normalizedId.includes('/lucide-react/')) return 'vendor-lucide'
  if (normalizedId.includes('/react-hot-toast/')) return 'vendor-toast'
  if (normalizedId.includes('/zustand/')) return 'vendor-state'
  if (normalizedId.includes('/react-hook-form/') || normalizedId.includes('/react-select/')) return 'vendor-forms'
  if (normalizedId.includes('/sweetalert2/')) return 'vendor-dialogs'

  return undefined
}

const deferEntryStylesheet = () => ({
  name: 'defer-entry-stylesheet',
  apply: 'build',
  enforce: 'post',
  transformIndexHtml(html) {
    return html.replace(
      /<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/,
      `<link rel="preload" as="style" crossorigin href="$1" onload="this.onload=null;this.rel='stylesheet'"><noscript><link rel="stylesheet" crossorigin href="$1"></noscript>`
    )
  }
})

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), deferEntryStylesheet()],
  build: {
    chunkSizeWarningLimit: 450,
    rollupOptions: {
      output: {
        manualChunks
      }
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true
  }
})
