/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/pages/dashboard.html", destination: "/dashboard", permanent: true },
      { source: "/pages/tables.html", destination: "/tables", permanent: true },
      { source: "/pages/billing.html", destination: "/billing", permanent: true },
      { source: "/pages/virtual-reality.html", destination: "/virtual-reality", permanent: true },
      { source: "/pages/rtl.html", destination: "/rtl", permanent: true },
      { source: "/pages/profile.html", destination: "/profile", permanent: true },
      { source: "/pages/sign-in.html", destination: "/sign-in", permanent: true },
      { source: "/pages/sign-up.html", destination: "/sign-up", permanent: true }
    ];
  }
};

export default nextConfig;
