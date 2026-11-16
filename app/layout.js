import { Fraunces, Figtree } from "next/font/google";
import "./globals.css";
import NavigationLoader from "@/components/NavigationLoader";

const display = Fraunces({ subsets: ["latin"], variable: "--font-display", weight: ["400", "600"] });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });

export const metadata = {
  title: "Sakoon",
  description: "Private online consultations with verified psychologists.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body>
        <NavigationLoader />
        {children}
      </body>
    </html>
  );
}