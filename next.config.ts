import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Serve public/ images as they are. Converting on the fly on Render's free
    // instance was slow and some conversions never finished, leaving images
    // that never appeared. Images are made web-ready ahead of time instead:
    // `node scripts/optimize-images.mjs <file> [maxWidth]`.
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3001/:path*',
      },
      {
        source: '/health',
        destination: 'http://127.0.0.1:3001/health',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // public/ files are otherwise sent with max-age=0, so every visit
        // re-checks every image. A day keeps repeat visits fast while a
        // replaced image (same name) still shows up by the next day.
        source: '/:all*(webp|png|jpg|jpeg|svg|gif)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
    ];
  },
};

export default nextConfig;
