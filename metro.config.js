// Metro config — expo-sqlite web support (wasm + SharedArrayBuffer)
// Requisito documentado de Expo SDK 57: https://docs.expo.dev/versions/v57.0.0/sdk/sqlite/
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite web: el worker de wa-sqlite importa el .wasm como asset.
config.resolver.assetExts.push('wasm');

// SharedArrayBuffer: wa-sqlite lo necesita en el navegador.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
