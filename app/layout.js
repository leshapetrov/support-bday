import "./globals.css";
import { NotificationProvider } from "../components/NotificationProvider";

export const metadata = {
  title: "Support Birthday - Запечатлим момент вместе",
  description: "Создавайте красивые коллажи с друзьями в честь 9-летия Support",
  keywords: "коллаж, фото, день рождения, support, праздник",
  authors: [{ name: "Support Team" }],
  manifest: "/manifest.json",
  metadataBase: new URL('https://support-birthday.vercel.app'),
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "Support Birthday - Запечатлим момент вместе",
    description: "Создавайте красивые коллажи с друзьями в честь 9-летия Support",
    type: "website",
    url: "https://support-birthday.vercel.app",
    images: [
      {
        url: "/favicon.ico",
        width: 120,
        height: 120,
        alt: "Support Birthday",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Support Birthday - Запечатлим момент вместе",
    description: "Создавайте красивые коллажи с друзьями в честь 9-летия Support",
    images: ["/favicon.ico"],
  },
};


export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FFCE00',
}

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Support Birthday" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
