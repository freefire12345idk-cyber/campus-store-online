/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better performance
  reactStrictMode: true,
  
  // Enable SWC minification for faster builds
  swcMinify: true,
  
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Enable compression
  compress: true,
  
  // Optimize package imports
  experimental: {
    optimizePackageImports: ['framer-motion', 'recharts', 'zod'],
    serverComponentsExternalPackages: ['bcryptjs'],
    optimizeCss: true,
    serverActions: {
      bodySizeLimit: '5mb',
    },
    appDir: true,
  },
  
  // Performance headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300'
          }
        ]
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  
  // Redirects for performance
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      }
    ]
  },
  
  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize chunks
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    }
    
    // Minimize bundle size
    config.optimization.usedExports = true
    config.optimization.sideEffects = false
    
    return config
  },
  
  // Output configuration
  output: 'standalone',
  
  // Power by header
  poweredByHeader: false,
};

module.exports = nextConfig;
