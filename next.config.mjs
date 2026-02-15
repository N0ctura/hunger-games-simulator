/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('Is Production?', isProd);

const nextConfig = {
  output: isProd ? 'export' : undefined,
  // In dev mode (isProd=false), we want no basePath so it runs at root /
  // In prod mode (isProd=true), we use the repo name for GitHub Pages
  // IMPORTANT: This must match your GitHub repository name exactly!
  basePath: isProd ? '/hunger-games-simulator' : '',
  assetPrefix: isProd ? '/hunger-games-simulator/' : '',
  // basePath: '',
  // assetPrefix: '',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.wolvesville.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
