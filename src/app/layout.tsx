import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DIAM | Gestión Inteligente de Obras",
  description: "Plataforma para gestionar obras de construcción y proyectos.",
};

import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      className={`${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground custom-scrollbar">
        <AuthProvider>
          {children}
          <Toaster 
            position="bottom-center"
            toastOptions={{
              className: 'glass-panel !bg-[#032C4F]/90 !text-white !border-white/20 !backdrop-blur-md',
              duration: 4000,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
