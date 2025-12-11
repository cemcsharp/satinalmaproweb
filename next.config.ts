import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: false,
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
};

export default withBundleAnalyzer(nextConfig);

