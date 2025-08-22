/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Only include vConsole in development builds
    if (!dev) {
      config.externals = config.externals || [];
      config.externals.push('vconsole');
    }
    
    return config;
  },
}

module.exports = nextConfig
