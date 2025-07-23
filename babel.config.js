// module.exports = function (api) {
//   api.cache(true);
//   api.cache(true);
//   return {
//     presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

//     plugins: [
//       [
//         'module-resolver',
//         {
//           root: ['./'],

//           alias: {
//             '@': './',
//             'tailwind.config': './tailwind.config.js',
//           },
//         },
//       ],
//     ],
//   };
// };

// babel.config.js
module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          // Включаем полифилл import.meta для Hermes
          unstable_transformImportMeta: true,
        },
      ],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@": "./",
            "tailwind.config": "./tailwind.config.js",
          },
        },
      ],
      // больше нет необходимости в transform-async-to-promises
    ],
  };
};
