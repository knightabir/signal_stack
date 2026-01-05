/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prevent trailing slash redirects for API routes (fixes Stripe webhook 307)
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
