import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Review submissions can carry a syllabus PDF (capped at 5MB); the
      // default Server Action body limit is 1MB. Headroom for form fields.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
