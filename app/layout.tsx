import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.menvo.com.br')
};

// This is the root layout that Next.js requires.
// Since we use internationalized routing, this layout
// just passes through the children to the [locale] layout.
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
