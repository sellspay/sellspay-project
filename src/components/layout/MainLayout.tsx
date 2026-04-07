import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
  darkMode?: boolean;
}

export default function MainLayout({ children, hideFooter = false, darkMode = true }: MainLayoutProps) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-background", darkMode && "dark")}>
      <Header />
      {/* Header is fixed (h-16), so offset page content */}
      <main className="flex-1 pt-16">{children}</main>
      {!hideFooter && (
        <>
          <Footer />
        </>
      )}
    </div>
  );
}
