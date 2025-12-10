const nextConfig = {
  reactStrictMode: false,
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
