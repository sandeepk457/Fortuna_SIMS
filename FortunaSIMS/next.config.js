/** @type {import('next').NextConfig} */
const nextConfig = {
  /* 
   * TEMPORARY:
   * Allow production deployment even when pending
   * TypeScript errors exist in undeveloped/static screens.
   */
  typescript: {
    ignoreBuildErrors: true,
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

module.exports = nextConfig;