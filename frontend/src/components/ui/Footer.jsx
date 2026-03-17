import { Link } from 'react-router-dom';
import { Shield, Github, Twitter, Linkedin, ExternalLink } from 'lucide-react';

const Footer = () => {
  const year = new Date().getFullYear();

  const cols = [
    {
      title: 'Product',
      links: [
        { label: 'Home',       path: '/' },
        { label: 'Demo',       path: '/demo' },
        { label: 'Extension',  path: '/extension' },
        { label: 'About',      path: '/about' },
      ],
    },
    {
      title: 'Support',
      links: [
        { label: 'Contact',      path: '/contact' },
        { label: 'Learn More',   path: '/learn-more' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { label: 'Privacy Policy',   path: '/privacy-policy' },
        { label: 'Terms of Service', path: '/terms-of-service' },
      ],
    },
  ];

  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 group mb-4 w-fit">
              <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                <Shield className="h-4 w-4 text-primary" strokeWidth={2.5} />
              </div>
              <span className="font-bold text-foreground">TypeAware</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4 max-w-xs">
              AI-powered content moderation and threat detection for safer digital communities.
            </p>
            <div className="flex gap-2">
              {[
                { icon: Github,   href: '#', label: 'GitHub' },
                { icon: Twitter,  href: '#', label: 'Twitter' },
                { icon: Linkedin, href: '#', label: 'LinkedIn' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-primary/10 transition-all"
                >
                  <s.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {cols.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                {col.title}
              </p>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-muted-foreground">
            © {year} TypeAware. All rights reserved.
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-security opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-security" />
              </span>
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
