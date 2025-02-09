/* eslint-env node */

/*
 * This file runs in a Node context (it's NOT transpiled by Babel), so use only
 * the ES6 features that are supported by your Node version. https://node.green/
 */

// Configuration for your app
// https://v2.quasar.dev/quasar-cli-vite/quasar-config-js

import { configure } from 'quasar/wrappers';
import { fileURLToPath } from 'node:url';

export default configure(() => {
  return {
    boot: [
      'axios',
      'pinia' // Añadido pinia al boot
    ],

    css: [
      'app.scss'
    ],

    extras: [
      'roboto-font',
      'material-icons'
    ],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node16'
      },

      vueRouterMode: 'history',

      alias: {
        src: fileURLToPath(new URL('./src', import.meta.url))
      }
    },

    devServer: {
      open: true
    },

    framework: {
      config: {
        brand: {
          primary: '#0095f6',
          secondary: '#1877f2',
          accent: '#262626',
          dark: '#000000',
          positive: '#58c322',
          negative: '#ed4956',
          info: '#8e8e8e',
          warning: '#FFA900'
        },
        notify: {
          position: 'top',
          timeout: 2500,
          textColor: 'white'
        }
      },
      plugins: [
        'Notify'
      ]
    },

    animations: [],

    ssr: {
      pwa: false,
      prodPort: 3000,
      middlewares: [
        'render'
      ]
    },

    pwa: {
      workboxMode: 'GenerateSW',
      injectPwaMetaTags: true,
      swFilename: 'sw.js',
      manifestFilename: 'manifest.json',
      useCredentialsForManifestTag: false
    }
  };
});
