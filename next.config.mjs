/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Invoice PDFs are uploaded through a server action; the Next.js
      // default limit is 1 MB.
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
