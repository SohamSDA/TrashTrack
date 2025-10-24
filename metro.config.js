const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Configure resolver to handle CSS imports properly
config.resolver.assetExts.push("css");

module.exports = withNativeWind(config, {
  input: "./global.css",
  inlineRem: 16,
});
