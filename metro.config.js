// const { getDefaultConfig } = require('expo/metro-config');
// const { withNativeWind } = require('nativewind/metro');

// const config = getDefaultConfig(__dirname);

// module.exports = withNativeWind(config, { input: './app/global.css' });

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Добавляем поддержку .wasm
config.resolver.assetExts = [...config.resolver.assetExts, "wasm"];

module.exports = withNativeWind(config, { input: "./app/global.css" });
