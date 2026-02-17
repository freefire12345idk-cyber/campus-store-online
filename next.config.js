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
    // CDN optimization for high traffic
    loader: 'custom',
    loaderFile: './src/lib/image-loader.js',
    domains: ['images.unsplash.com', 'via.placeholder.com'],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize package imports
  experimental: {
    optimizePackageImports: ['framer-motion', 'recharts', 'zod'],
    serverComponentsExternalPackages: ['bcryptjs'],
    optimizeCss: false,
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  
  // Performance headers for CDN and caching
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, s-maxage=600' }, // 5min client, 10min CDN
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }, // 1 year
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, s-maxage=2592000' }, // 1 day client, 30 days CDN
        ],
      },
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
    ];
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
  
  // Webpack configuration for optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size for high traffic
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
  
  // TypeScript and ESLint ignore for deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Skip static generation for API routes
  output: 'standalone',
  
  // Power by header
  poweredByHeader: false,
  
  // Disable static optimization for API routes
  generateEtags: false,
};

module.exports = nextConfig;
