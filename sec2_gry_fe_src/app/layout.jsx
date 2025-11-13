import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'flowbite';
import { CartProvider } from "./context/CartContext"
import { AuthProvider } from './context/AuthContext';

// 🎯 1. Import CSS ของ Leaflet ที่นี่
import "leaflet/dist/leaflet.css";
import { icons } from "lucide-react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'LINE GIRL',
  description: 'Login to our website',
  icons: {
    icon:"/im.jpg"
  }
};

// แยก viewport เป็น export ของตัวเอง
export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
       
        <CartProvider>
        <AuthProvider>
          {children}
          </AuthProvider>
        </CartProvider>
     
      </body>
    </html>
  );
}
