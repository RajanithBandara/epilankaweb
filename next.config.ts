import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'store.epilanka.app',
                port: '',
                pathname: '/profiles/**',
            },
        ],
    },
};

export default nextConfig;
