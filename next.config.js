/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['hebbkx1anhila5yf.public.blob.vercel-storage.com'],
  },
  webpack: (config, { dev, isServer }) => {
    // 仅在生产构建中应用这些优化
    if (!dev && !isServer) {
      config.optimization.minimize = true;
      config.optimization.minimizer.push(
        new (require('terser-webpack-plugin'))({
          terserOptions: {
            parse: {
              ecma: 2020,
            },
            compress: {
              ecma: 5,
              warnings: false,
              comparisons: false,
              inline: 2,
              drop_console: true,
            },
            mangle: {
              safari10: true,
            },
            output: {
              ecma: 5,
              comments: false,
              ascii_only: true,
            },
          },
        })
      );
    }

    // 为所有的 JavaScript 和 TypeScript 文件启用源码映射
    if (dev) {
      config.devtool = 'eval-source-map';
    } else {
      config.devtool = 'source-map';
    }

    return config;
  },
  experimental: {
    optimizeFonts: true,
    scrollRestoration: true,
  },
  poweredByHeader: false,
  generateEtags: true,
  compress: true,
  productionBrowserSourceMaps: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
