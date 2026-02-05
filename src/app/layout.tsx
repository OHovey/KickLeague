import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

// Root layout is a minimal shell. The real layout with providers, fonts,
// and metadata lives in src/app/[locale]/layout.tsx (managed by next-intl).
export default function RootLayout({ children }: Props) {
  return children;
}
