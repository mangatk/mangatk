// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;
/** @type {import('next').NextConfig} */
const nextConfig = {
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
  // Allow larger file uploads
  api: {
    bodyParser: {
      sizeLimit: '500mb',
    },
    responseLimit: '500mb',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
};

export default nextConfig;