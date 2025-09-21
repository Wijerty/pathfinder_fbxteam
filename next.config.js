/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // App Router включен по умолчанию в Next.js 14
  },
  // Безопасность: отключаем внешние хосты по умолчанию
  images: {
    domains: [],
    remotePatterns: []
  },
  // CSP заголовки для дополнительной безопасности
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
