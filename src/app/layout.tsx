"use client"
import './globals.scss'
import React, { useState } from 'react'
import { lightTheme, darkTheme } from '@/theme/theme'
import { ThemeProvider, CssBaseline } from '@mui/material'

import Providers from './providers'
import Header from '../layout/Header/Header'
import Footer from '../layout/Footer/Footer'
import Head from 'next/head';

import { dir } from 'i18next'
import { languages } from '../app/i18n/settings'

// const languages = ['en', 'es', 'pt']
export async function generateStaticParams() {
  return languages.map((lng) => ({ lng }))
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: {
    lng: string;
  };
}

export default function RootLayout({ children, params: { lng } }: RootLayoutProps) {
  const [isDark, setIsDark] = useState(false)
  const switchTheme: any = () => {
    setIsDark(!isDark)
  }
  return (
    <html lang={lng}>
      <Head>
        <meta charSet="utf-8" />
        <title>Menvo</title>
        <meta name="description" content="Menvo is a free mentoring plataform for students looking for their first professional opportunities." />
        <meta name="viewport" content="initial-scale=1.0, width=device-width" />
      </Head>
      <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
        <CssBaseline />
        <body>
          <Providers >
            <Header switchTheme={switchTheme} isDark={isDark} />
            {children}
            <Footer />
          </Providers>
        </body>
      </ThemeProvider>
    </html>
  )
}
