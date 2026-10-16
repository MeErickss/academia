import type { NextConfig } from "next";

// Site 100% estático: todos os dados ficam no aparelho (IndexedDB),
// então não precisa de servidor — o Vercel só serve os arquivos.
const nextConfig: NextConfig = {
  output: "export",
  reactCompiler: true,
  images: { unoptimized: true },
};

export default nextConfig;
