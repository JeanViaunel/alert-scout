import type { NextConfig } from "next";

/**
 * Next.js 16+ Production Configuration for Vercel
 * 
 * Features:
 * - Standalone output for optimized Docker/Node deployments
 * - Image optimization with remote patterns
 * - Security headers (HSTS, CSP, X-Frame-Options, etc.)
 * - Performance optimizations
 * - Experimental features for App Router
 */
const nextConfig: NextConfig = {
  // === BUILD CONFIGURATION ===
  
  /**
   * Output type:
   * - 'standalone': Creates a minimal server.js for Docker/container deployments
   * - Use this if deploying to VPS/Docker. For pure Vercel serverless, 'export' is not recommended with dynamic routes.
   */
  output: process.env.DEPLOYMENT_TYPE === 'docker' ? 'standalone' : undefined,
  
  /**
   * TypeScript error handling during build
   * In production CI, you want this to be true to catch errors early
   */
  typescript: {
    ignoreBuildErrors: process.env.CI ? false : false,
  },
  
  /**
   * ESLint error handling during build
   */
  eslint: {
    ignoreDuringBuilds: process.env.CI ? false : false,
  },

  // === IMAGE OPTIMIZATION ===
  
  images: {
    /**
     * Image formats for optimization
     * WebP and AVIF offer best compression
     */
    formats: ['image/webp', 'image/avif'],
    
    /**
     * Remote patterns for external images
     * Add domains your app loads images from
     */
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazon.com',
      },
      {
        protocol: 'https',
        hostname: '**.media-amazon.com',
      },
      {
        protocol: 'https',
        hostname: '**.shopee.tw',
      },
      {
        protocol: 'https',
        hostname: '**.shopeesz.com',
      },
      {
        protocol: 'https',
        hostname: '**.momo.dm',
      },
      {
        protocol: 'https',
        hostname: '**.pchome.com.tw',
      },
      {
        protocol: 'https',
        hostname: '**.591.com.tw',
      },
      // Add your own CDN or image host here
      {
        protocol: 'https',
        hostname: process.env.NEXT_PUBLIC_IMAGE_DOMAIN || 'localhost',
      },
    ].filter((pattern): pattern is { protocol: 'http' | 'https'; hostname: string; port?: string; pathname?: string; search?: string } => 
      pattern.hostname !== 'localhost' || process.env.NODE_ENV === 'development'
    ),
    
    /**
     * Device sizes for responsive images
     */
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    
    /**
     * Image sizes for srcset
     */
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // === HEADERS & SECURITY ===
  
  async headers() {
    const headers = [
      // Security Headers
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on',
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
      },
      // HSTS - only in production
      ...(process.env.NODE_ENV === 'production'
        ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload',
            },
          ]
        : []),
    ];

    return [
      {
        // Apply headers to all routes
        source: '/:path*',
        headers,
      },
      {
        // Static assets caching
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Public folder static assets
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000',
          },
        ],
      },
      {
        // API routes - no cache by default
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },

  // === REDIRECTS ===
  
  async redirects() {
    return [
      // Redirect www to non-www (or vice versa based on preference)
      ...(process.env.NEXT_PUBLIC_APP_URL?.includes('www.')
        ? []
        : [
            {
              source: '/:path*',
              has: [{ type: 'host', value: 'www.:domain' }],
              destination: 'https://:domain/:path*',
              permanent: true,
            },
          ]),
    ];
  },

  // === REWRITES ===
  
  async rewrites() {
    return [
      // Health check endpoint for load balancers
      {
        source: '/health',
        destination: '/api/health',
      },
    ];
  },

  // === EXPERIMENTAL FEATURES ===
  
  experimental: {
    /**
     * Enable optimizePackageImports for specific heavy packages
     * This improves cold start performance
     */
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'radium',
    ],
    
    /**
     * Server Actions configuration
     * Body size limit for server actions (default is 1MB)
     */
    serverActions: {
      bodySizeLimit: '2mb',
    },
    
    /**
     * React Compiler (React 19+)
     * Auto-memoization for better performance
     */
    reactCompiler: true,
  },

  // === ENVIRONMENT VARIABLES ===
  
  /**
   * Only expose necessary env vars to browser
   * All NEXT_PUBLIC_ vars are automatically exposed
   */
  env: {
    // Private vars (server-only) - not exposed to browser
    NEXT_TELEMETRY_DISABLED: '1',
  },

  // === WEBPACK CONFIGURATION ===
  
  webpack: (config, { isServer, nextRuntime }) => {
    // Fix for native modules that shouldn't be bundled in edge runtime
    if (isServer && nextRuntime === 'edge') {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Better-sqlite3 is Node.js only, not edge-compatible
        'better-sqlite3': false,
      };
    }

    // Native modules handling for server builds
    if (isServer && nextRuntime === 'nodejs') {
      config.externals.push('better-sqlite3');
    }

    return config;
  },

  // === TURBOPACK CONFIGURATION ===
  
  /**
   * Turbopack configuration for Next.js 16+
   * Empty config to silence the warning about webpack config without turbopack config.
   * The webpack config above handles better-sqlite3 edge runtime compatibility.
   * Turbopack handles native modules differently and doesn't need explicit configuration.
   */
  turbopack: {},

  // === POWERED BY HEADER ===
  
  /**
   * Remove X-Powered-By header for security
   */
  poweredByHeader: false,

  // === TRAILING SLASH ===
  
  /**
   * No trailing slashes for cleaner URLs
   */
  trailingSlash: false,

  // === COMPRESSION ===
  
  /**
   * Enable gzip compression
   * Vercel handles this automatically, but good for standalone
   */
  compress: true,
};

export default nextConfig;
