import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield, Menu, X, LogIn, UserPlus, LogOut, Moon, Sun,
  LayoutDashboard, Settings, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Navigation = () => {
  const [isOpen, setIsOpen]   = useState(false);
  const [isDark, setIsDark]   = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setIsOpen(false); }, [location.pathname]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const isActive = (p) => location.pathname === p;

  const publicLinks = [
    { path: '/',          label: 'Home' },
    { path: '/about',     label: 'About' },
    { path: '/demo',      label: 'Demo' },
    { path: '/extension', label: 'Extension' },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-200 ${
        scrolled
          ? 'bg-card/95 backdrop-blur-xl border-b border-border shadow-elegant'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
              <Shield className="h-4.5 w-4.5 text-primary" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-lg text-foreground tracking-tight">TypeAware</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {publicLinks.map((item) => (
              <Link key={item.path} to={item.path}>
                <button
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive(item.path)
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {item.label}
                </button>
              </Link>
            ))}
          </div>

          {/* Auth actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isAuthenticated ? (
              <>
                <div className="w-px h-5 bg-border mx-1" />
                <Link to={isAdmin ? '/admin' : '/dashboard'}>
                  <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <div className="flex items-center gap-2 pl-2 border-l border-border">
                  <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/25 flex items-center justify-center text-primary text-xs font-bold">
                    {(user?.name || user?.username || 'U')[0].toUpperCase()}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-muted-foreground hover:text-danger transition-colors font-medium flex items-center gap-1.5"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="gap-1.5">
                    <UserPlus className="h-4 w-4" />
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-secondary transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-card border-t border-border px-4 py-3 space-y-1">
          {publicLinks.map((item) => (
            <Link key={item.path} to={item.path}>
              <button
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                {item.label}
              </button>
            </Link>
          ))}

          <div className="border-t border-border pt-2 mt-2 space-y-1">
            {isAuthenticated ? (
              <>
                <Link to={isAdmin ? '/admin' : '/dashboard'}>
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full justify-start gap-2 text-danger hover:bg-danger/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="w-full justify-start gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="w-full justify-start gap-2">
                    <UserPlus className="h-4 w-4" />
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
