"use client"
import './globals.scss'
import { Inter } from 'next/font/google'
import Providers from './providers'
import Header from '../layout/Header'
import Footer from '../layout/Footer'
import Head from 'next/head';

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>Menvo1</title>
        <meta name="description" content="Menvo is a free mentoring plataform for students looking for their first professional opportunities." />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </Head>
      <body className={inter.className}>
        <Providers >
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
