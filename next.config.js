/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['hebbkx1anhila5yf.public.blob.vercel-storage.com'],
  },
  swcMinify: false,
  webpack: (config, { dev, isServer }) => {
    // 仅在生产构建中应用这些优化
    if (!dev) {
      config.optimization.minimize = true;
      config.optimization.minimizer = config.optimization.minimizer.map((plugin) => {
        if (plugin.constructor.name === 'TerserPlugin') {
          return new plugin.constructor({
            terserOptions: {
              parse: {
                ecma: 2020,
              },
              compress: {
                ecma: 5,
                warnings: false,
                comparisons: false,
                inline: 2,
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
          });
        }
        return plugin;
      });
    }
    return config;
  },
};

module.exports = nextConfig;
