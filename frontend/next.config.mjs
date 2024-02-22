/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  reactStrictMode: true,
  transpilePackages: [
    'rc-util',
    '@babel/runtime',
    '@ant-design',
    'rc-pagination',
    'rc-picker',
  ],
};

export default nextConfig;