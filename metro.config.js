const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const projectRoot = __dirname;
// The @kowloon/client package is a sibling at ../client, linked via a
// file: dependency in package.json. Metro needs to be told to watch it and
// to follow the resulting symlink.
const clientRoot = path.resolve(projectRoot, "..", "client");

const config = getDefaultConfig(projectRoot);

config.watchFolders = [...(config.watchFolders || []), clientRoot];

// Keep hierarchical lookup enabled so Metro can find nested deps (e.g.
// @expo/metro-runtime, which gets nested under expo-router/node_modules when
// legacy-peer-deps prevents hoisting). We just need symlink + package
// exports support for the @kowloon/client file: dep to resolve.
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

module.exports = withNativeWind(config, { input: "./global.css" });
