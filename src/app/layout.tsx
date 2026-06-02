import { ToastContainer } from "react-toastify";
import "./globals.css";
import ThemeProvider from "@/components/providers/theme-provider";
import AppLoader from "@/components/LoaderScreen";

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
         <AppLoader>
          {children}
          </AppLoader>

          <ToastContainer position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}