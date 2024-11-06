/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['hebbkx1anhila5yf.public.blob.vercel-storage.com'],
  },
  webpack: (config, { isServer }) => {
    // 修改 Terser 配置以更好地处理类属性和方法
    if (!isServer) {
      config.optimization.minimizer = config.optimization.minimizer.map(minimizer => {
        if (minimizer.constructor.name === 'TerserPlugin') {
          return new minimizer.constructor({
            terserOptions: {
              parse: {
                ecma: 2020,
              },
              compress: {
                ecma: 5,
                warnings: false,
                // 禁用可能导致类属性问题的优化
                passes: 1,
                pure_getters: false,
              },
              mangle: {
                safari10: true,
                keep_classnames: true,
                keep_fnames: true,
              },
              output: {
                ecma: 5,
                comments: false,
                ascii_only: true,
              },
            },
          });
        }
        return minimizer;
      });
    }
    return config;
  },
};

module.exports = nextConfig;
