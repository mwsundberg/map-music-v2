import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          'babel-plugin-react-compiler',
          ['babel-plugin-styled-components', {
            displayName: true,
            ssr: true,
            pure: true,
          }],
        ],
      },
    }),
  ],
  server: {
    port: 8080,
  },
})
