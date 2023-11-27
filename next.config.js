/** @type {import('next').NextConfig} */
module.exports = {
  output: 'standalone',
  webpack: (config, options) => {
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    })
 
    return config;
  }
}
