/** @type {import('next').NextConfig} */
import { NextFederationPlugin } from '@module-federation/nextjs-mf';

const nextConfig = {
  reactStrictMode: true,
  webpack(config, options) {
    const { isServer } = options;
    config.plugins.push(
      new NextFederationPlugin({
        name: 'home',
        remotes: {
          services: `services@${process.env.NEXT_PUBLIC_SERVICES_APP}/_next/static/${isServer ? 'ssr' : 'chunks'}/remoteEntry.js`
        },
        filename: 'static/chunks/remoteEntry.js',
        exposes: {},
        extraOptions: {
          exposePages: true,
          automaticAsyncBoundary: true
        },
        shared: {
          antd: {
            requiredVersion: false,
            singleton: true
          },
        },
      }),
    );

    return config;
  },
};

export default nextConfig;
