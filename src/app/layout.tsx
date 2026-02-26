import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "CanvasCrafter",
    description: "A high-performance, self-hosted design platform.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
