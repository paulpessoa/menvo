"use client"
import './globals.scss'
import React, { useState } from 'react'
import { lightTheme, darkTheme } from 'theme'
import { ThemeProvider, CssBaseline } from '@mui/material'

import { Inter } from 'next/font/google'
import Providers from './providers'
import Header from '../layout/Header/Header'
import Footer from '../layout/Footer/Footer'
import Head from 'next/head';
import GoogleAnalytics from 'utils/google-analytics'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const switchTheme: any = () => {
    setIsDark(!isDark)
  }
  return (
    <html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <title>Menvo</title>
        <meta name="description" content="Menvo is a free mentoring plataform for students looking for their first professional opportunities." />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
        <link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </Head>
      <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
        <CssBaseline />
        <body className={inter.className}>
          <Providers >
            <Header switchTheme={switchTheme} isDark={isDark} />
            {children}
            <Footer />
          </Providers>
        </body>
      </ThemeProvider>
      <GoogleAnalytics />
    </html>
  )
}
