import type { Metadata } from "next";
import { Inter, Changa_One } from "next/font/google";
import "./globals.css";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const changaOne = Changa_One({
    weight: "400",
    subsets: ["latin"],
    variable: "--font-changa",
    display: "swap",
});

export const metadata: Metadata = {
    title: "CanvasCrafter",
    description: "Matchday graphics studio.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning className={`${inter.variable} ${changaOne.variable}`}>
            <body className="antialiased">
                {children}
            </body>
        </html>
    );
}
