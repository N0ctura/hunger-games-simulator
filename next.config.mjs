/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const isGithubActions = process.env.GITHUB_ACTIONS || process.env.CI || false;

console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('Is Production?', isProd);
console.log('Is GitHub Actions?', isGithubActions);

const nextConfig = {
  output: isProd ? 'export' : undefined,
  // Only use basePath/assetPrefix when building for GitHub Pages (in CI)
  // This allows local production builds (npm run build && npm start) to work without the prefix
  basePath: (isProd && isGithubActions) ? '/hunger-games-simulator' : '',
  assetPrefix: (isProd && isGithubActions) ? '/hunger-games-simulator/' : '',
  env: {
    // Espone il base path al client per gestire correttamente i percorsi manuali (es. new Audio)
    NEXT_PUBLIC_BASE_PATH: (isProd && isGithubActions) ? '/hunger-games-simulator' : '',
  },
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
