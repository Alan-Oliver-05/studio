import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: [
    "https://9002-firebase-studio-1747156073196.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev",
    "https://9000-firebase-studio-1747156073196.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev",
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
