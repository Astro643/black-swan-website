/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.discordapp.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.discordapp.com',
      },
    ],
  },
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI,
    ADMIN_GUILD_ID: process.env.ADMIN_GUILD_ID,
    RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
  },
  // Enable React Strict Mode
  reactStrictMode: true,
  // Output standalone for Render deployment
  output: 'standalone',
};

module.exports = nextConfig;
