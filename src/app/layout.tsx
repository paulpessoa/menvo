"use client"
import './globals.scss'
import { Inter } from 'next/font/google'
import Providers from './providers'
import Header from '../layout/Header'
import Footer from '../layout/Footer'

const inter = Inter({ subsets: ['latin'] })
export const metadata = {
  title: 'Menvo',
  description: 'Volunteer Mentors',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers >
          <Header/>
          {children}
          <Footer/>
        </Providers>
      </body>
    </html>
  )
}
