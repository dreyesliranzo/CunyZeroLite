import type { Metadata } from "next";
import "./globals.css";
import HomeChatWidget from "@/src/components/HomeChatWidget";

export const metadata: Metadata = {
  // 1. The Title (Template ensures sub-pages look consistent)
  title: {
    default: "Student Portal | CunyZeroLite",
    template: "%s | CunyZeroLite",
  },
  // 2. The Description (What shows up in Google search results)
  description: "Official CunyZeroLite institutional portal. Access your academic records, financial aid, and course registration securely.",
  
  // 3. Open Graph (How the link looks when shared on social media/Discord)
  openGraph: {
    title: "CunyZeroLite Student Portal",
    description: "Secure gateway for City University students.",
    url: "https://cunyzerolite.edu", // Replace with your actual domain later
    siteName: "CunyZeroLite",
    locale: "en_US",
    type: "website",
  },

  // 4. Icons (This sets your Favicon)
  icons: {
    icon: "/favicon.ico", // Make sure to put a favicon.ico in your /public folder
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Theme color for mobile browser bars */}
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body>
        {children}
        <HomeChatWidget />
      </body>
    </html>
  );
}