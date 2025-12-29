/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // إذا صورك من دومينات كثيرة ومحتار: الحل الأسرع هو تعطيل optimization
  // (بدل محاولة السماح لكل الدومينات)
  images: {
    unoptimized: true,
  },

  experimental: {
    serverActions: {
      // تقدر ترفعها، لكن تذكر: Vercel عندها حد payload 4.5MB غالبًا
      bodySizeLimit: "4mb",
    },
  },

  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${process.env.BACKEND_ORIGIN}/:path*`,
      },
    ];
  },
};

export default nextConfig;
