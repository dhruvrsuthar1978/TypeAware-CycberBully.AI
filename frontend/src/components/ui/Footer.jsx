import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-muted p-6 mt-8 text-center text-sm text-muted-foreground border-t border-border">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-center gap-6">
        <a href="/contact" className="hover:underline">Contact Us</a>
        <a href="/learn-more" className="hover:underline">Learn More</a>
        <a href="/privacy-policy" className="hover:underline">Privacy Policy</a>
        <a href="/terms-of-service" className="hover:underline">Terms of Service</a>
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} TypeAware. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
