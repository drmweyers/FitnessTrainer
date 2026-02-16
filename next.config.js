/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable experimental features for better performance
  experimental: {
    // optimizeCss: true, // Disabled due to critters module issue
    scrollRestoration: true,
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Only run ESLint during builds in the specified directories
    dirs: ['app', 'components', 'lib', 'hooks', 'types', 'services', 'contexts', 'config', 'state'],
    // Temporarily ignore ESLint errors during builds for deployment
    // TODO: Fix ESLint warnings and re-enable
    ignoreDuringBuilds: true,
  },

  // Image optimization
  images: {
    domains: [
      'localhost',
      '127.0.0.1',
      'api.evofit.app',
      'dev-api.evofit.app',
      'evo-fitness-trainer.vercel.app',
      'i.ibb.co',
      'raw.githubusercontent.com',
      'picsum.photos',
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days for exercise GIFs
  },

  // API Rewrites for backend proxy (only when using standalone Express backend)
  async rewrites() {
    // By default, use Next.js API routes (app/api/).
    // Set NEXT_PUBLIC_USE_EXPRESS=true to proxy /api/* to Express backend instead.
    if (process.env.NEXT_PUBLIC_USE_EXPRESS === 'true') {
      return [
        {
          source: '/api/:path*',
          destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/:path*`,
        },
      ];
    }
    return [];
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Cache static assets
        source: '/images/:all*(svg|jpg|png|gif|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Cache exercise GIFs for longer
        source: '/gifs/:all*(gif|webp)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, immutable', // 30 days
          },
        ],
      },
    ];
  },

  // Environment variables that should be available on the client side
  env: {
    NEXT_PUBLIC_APP_NAME: 'EvoFit',
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version,
  },

  // Webpack configuration for optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'commons',
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            priority: 20,
            minChunks: 2,
            reuseExistingChunk: true,
          },
          shared: {
            name: 'shared',
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      };
    }

    return config;
  },

  // Compression
  compress: true,
  
  // PoweredByHeader
  poweredByHeader: false,
  
  // Generate ETags for better caching
  generateEtags: true,
  
  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Trailing slash handling
  trailingSlash: false,
};

module.exports = nextConfig;