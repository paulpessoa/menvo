import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './i18n/request.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "@supabase/supabase-js",
    "googleapis",
    "google-auth-library"
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false
      }
    }
    return config
  },
  images: {
    domains: ["localhost", "supabase.co", "images.unsplash.com"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        port: "",
        pathname: "/storage/v1/object/public/**"
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**"
      }
    ],
    unoptimized: true
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  typescript: {
    ignoreBuildErrors: false
  }
}

export default withNextIntl(nextConfig);
