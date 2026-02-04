import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { PreFooterBanner } from '@/components/home/PreFooterBanner';

interface MainLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export default function MainLayout({ children, hideFooter = false }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">{children}</main>
      {!hideFooter && (
        <>
          <PreFooterBanner />
          <Footer />
        </>
      )}
    </div>
  );
}
