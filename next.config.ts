import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: '(?:www\\.)?trsyp\\.ieee\\.tn',
          },
        ],
        destination: 'https://rtc.ieee.tn/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
