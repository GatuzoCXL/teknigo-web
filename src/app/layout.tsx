import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import MaintenanceMode from "@/components/MaintenanceMode";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Teknigo - Servicios Técnicos Profesionales",
  description: "Plataforma para conectar clientes con técnicos profesionales",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <Navbar />
          <MaintenanceMode>{children}</MaintenanceMode>
        </AuthProvider>
      </body>
    </html>
  );
}
