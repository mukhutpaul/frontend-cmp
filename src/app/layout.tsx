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