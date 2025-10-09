import { Link } from 'react-router-dom';
import { Shield, Mail, Heart, Github, Twitter, Linkedin } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const footerLinks = [
    { label: 'Contact Us', path: '/contact' },
    { label: 'Learn More', path: '/learn-more' },
    { label: 'Privacy Policy', path: '/privacy-policy' },
    { label: 'Terms of Service', path: '/terms-of-service' }
  ];
  
  const socialLinks = [
    { icon: Github, href: '#', label: 'GitHub' },
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' }
  ];

  return (
    <footer className="bg-gradient-to-b from-background to-muted/30 border-t border-border/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-3 mb-4 group w-fit">
              <div className="relative">
                <Shield className="h-8 w-8 text-primary group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-30 blur-md group-hover:opacity-50 transition-opacity"></div>
              </div>
              <span className="text-2xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
                TypeAware
              </span>
            </Link>
            <p className="text-muted-foreground mb-4 max-w-md leading-relaxed">
              Protecting digital communities with advanced AI-powered content moderation. 
              Making the internet a safer place, one interaction at a time.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-primary/10 hover:bg-gradient-primary flex items-center justify-center text-primary hover:text-white transition-all duration-300 hover:scale-110 hover:shadow-lg"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {footerLinks.slice(0, 2).map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.path} 
                    className="text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="font-display font-bold text-lg mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.slice(2).map((link, index) => (
                <li key={index}>
                  <Link 
                    to={link.path} 
                    className="text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-2 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              &copy; {currentYear} TypeAware. All rights reserved. Made with 
              <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" /> 
              for a safer internet.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <a href="mailto:support@typeaware.com" className="hover:text-primary transition-colors">
                support@typeaware.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;