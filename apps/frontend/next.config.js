/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Modern PDF.js worker configuration
      const CopyPlugin = require('copy-webpack-plugin');
      config.plugins.push(
        new CopyPlugin({
          patterns: [
            {
              from: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
              to: '../public/pdf.worker.min.mjs',
            },
            {
              from: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
              to: '../public/pdf.worker.mjs',
            },
          ],
        })
      );
    }
    
    // Add security headers for PDF handling
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      encoding: false,
    };
    
    return config;
  },
  
  // Security headers
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
