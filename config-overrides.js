const webpack = require('webpack');

module.exports = function override(config, env) {
  // Добавляем fallbacks для Node.js модулей в webpack 5
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": false, // Отключаем crypto модуль (не нужен в браузере)
    "stream": false, // Отключаем stream модуль (не нужен в браузере)
    "buffer": false, // Отключаем buffer модуль
    "util": false,   // Отключаем util модуль
    "assert": false, // Отключаем assert модуль
    "http": false,   // Отключаем http модуль
    "https": false,  // Отключаем https модуль
    "os": false,     // Отключаем os модуль
    "url": false,    // Отключаем url модуль
    "zlib": false,   // Отключаем zlib модуль
    "querystring": false, // Отключаем querystring модуль
    "path": false,   // Отключаем path модуль
    "fs": false,     // Отключаем fs модуль
  };

  // Добавляем плагины для игнорирования предупреждений
  config.plugins = [
    ...config.plugins,
    new webpack.IgnorePlugin({
      resourceRegExp: /^crypto$/,
      contextRegExp: /jsonwebtoken/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^stream$/,
      contextRegExp: /jws/,
    }),
  ];

  // Отключаем предупреждения о критических зависимостях
  config.module.unknownContextCritical = false;
  config.module.exprContextCritical = false;

  return config;
};
