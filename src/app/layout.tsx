import { ToastContainer } from "react-toastify";
import "./globals.css";
import ThemeProvider from "@/components/providers/theme-provider";

export const metadata = {
  title: "Control Manager",
  icons: {
    icon: "/aba.png",
    shortcut: "/aba.png",
    apple: "/aba.png",
  },
};

export function registerBanner() {
  console.log(`
========================================
        ABA CM PNC SYSTEM
        VERSION : 1.0.0
        STATUS   : RUNNING
========================================
  `);
}
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <ThemeProvider>
          {children}

          <ToastContainer position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}