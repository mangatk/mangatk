// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output disabled for PM2 deployment
  // تجاهل أخطاء التايب سكريبت لمنع توقف الرفع
  typescript: {
    ignoreBuildErrors: true,
  },
  // تجاهل أخطاء ESLint لمنع توقف الرفع
  eslint: {
    ignoreDuringBuilds: true,
  },
  // إعدادات الصور (اختياري، اتركها لضمان عدم حدوث مشاكل مع الصور الخارجية)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
};

export default nextConfig;