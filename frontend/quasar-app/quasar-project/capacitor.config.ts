// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ivanmm.calistenicapp', // ⚠️ ¡CAMBIA ESTO! Identificador único (reverse domain name)
  appName: 'CalistenicApp',             // ⚠️ ¡CAMBIA ESTO! Nombre de tu aplicación
  webDir: 'dist/spa',                   // Directorio de la web app construida por Quasar
  server: {
    cleartext: true        // ⚠️ ¡PELIGRO! Permite conexiones HTTP (solo para DESARROLLO LOCAL)
  }};

export default config;