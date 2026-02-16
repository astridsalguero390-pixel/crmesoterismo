import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "CRM Esotérico - Omnicanal",
    description: "CRM para negocio esotérico con WhatsApp, Instagram y Facebook Messenger",
    manifest: "/manifest.json",
    themeColor: "#8b5cf6",
    viewport: "width=device-width, initial-scale=1, maximum-scale=1",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "CRM Esotérico",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <head>
                <link rel="icon" href="/favicon.ico" />
                <link rel="apple-touch-icon" href="/icon-192.png" />
            </head>
            <body className="antialiased">{children}</body>
        </html>
    );
}
