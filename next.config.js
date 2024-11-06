/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['hebbkx1anhila5yf.public.blob.vercel-storage.com'],
    },
    swcMinify: false, // 将 swcMinify 设置为 false
}

module.exports = nextConfig;
