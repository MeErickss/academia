import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/AppShell";
import { WatercolorDefs } from "@/components/art";
import "./globals.css";

export const metadata: Metadata = {
  title: "Girassol — diário de treino",
  description: "Fichas de treino, registro de séries e evolução — tudo guardado no seu celular.",
  applicationName: "Girassol",
  appleWebApp: { capable: true, title: "Girassol", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf0" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1712" },
  ],
};

// Aplica o tema escolhido (claro/escuro) antes da página aparecer, sem "piscar".
const themeScript = `try{var t=localStorage.getItem("girassol-tema");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <WatercolorDefs />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
