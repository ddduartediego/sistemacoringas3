import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      'lh3.googleusercontent.com',  // Para avatares do Google
      'avatars.githubusercontent.com',  // Para avatares do GitHub
      'graph.facebook.com',  // Para avatares do Facebook
    ],
  },
};

export default nextConfig;
