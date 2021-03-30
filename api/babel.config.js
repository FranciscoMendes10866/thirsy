module.exports = {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            node: 'current'
          }
        }
      ],
      '@babel/preset-typescript'
    ],
    plugins: [
      ['module-resolver', {
        alias: {
          '@providers': './src/providers',
          '@functions': './src/functions',
          '@utils': './src/utils'
        }
      }]
    ]
  }
