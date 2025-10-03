
import React from 'react';
import Navigation from './Navigation';
import Footer from '../ui/Footer';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navigation />
      <main className="pt-16 flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;