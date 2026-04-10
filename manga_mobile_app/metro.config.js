const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// تعطيل الميزة التي تسبب محاولة إنشاء مجلدات غير قانونية في ويندوز
config.resolver.unstable_enablePackageExports = false;

module.exports = config;