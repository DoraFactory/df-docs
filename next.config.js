const withNextra = require('nextra')({
  theme: 'nextra-theme-docs',
  themeConfig: './theme.config.jsx',
  defaultShowCopyCode: true,
})

// module.exports = withNextra()

// If you have other Next.js configurations, you can pass them as the parameter:
module.exports = withNextra({
  /* other next.js config */
  reactStrictMode: true, // Recommended for the `pages` directory, default in `app`.
  
  webpack(config) {
    // const allowedSvgRegex = /components\/icons\/.+\.svg$/
    const allowedSvgRegex = /\.svg$/i

    const fileLoaderRule = config.module.rules.find(rule =>
      rule.test?.test('.svg')
    )
    fileLoaderRule.exclude = allowedSvgRegex

    config.module.rules.push({
      test: allowedSvgRegex,
      use: ['@svgr/webpack']
    })
    return config
  },
})
