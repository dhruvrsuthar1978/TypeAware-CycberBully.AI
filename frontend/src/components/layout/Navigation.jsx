import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, Menu, X, Home, Info, LogIn, UserPlus, LayoutDashboard, Settings, LogOut, Moon, Sun, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Home', icon: Home, public: true },
    { path: '/about', label: 'About', icon: Info, public: true },
    { path: '/demo', label: 'Demo', icon: Shield, public: true },
    { path: '/extension', label: 'Extension', icon: Download, public: true },
  ];

  const authItems = isAuthenticated
    ? isAdmin
      ? [
          { path: '/admin', label: 'Admin Panel', icon: LayoutDashboard },
          { path: '/settings', label: 'Settings', icon: Settings },
        ]
      : [
          { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { path: '/settings', label: 'Settings', icon: Settings },
        ]
    : [
        { path: '/login', label: 'Login', icon: LogIn },
        { path: '/signup', label: 'Sign Up', icon: UserPlus },
      ];

  // Show public navigation only when not authenticated
  const showPublicNav = !isAuthenticated;

  return (
    <nav className="fixed top-0 w-full z-50 bg-card/95 backdrop-blur-lg border-b border-border shadow-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover-glow rounded-lg p-2 -m-2">
            <div className="relative">
              <Shield className="h-8 w-8 text-primary" />
              <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-20 blur-sm"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              TypeAware
            </span>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(!isOpen)}
              className="hover-glow"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Navigation items */}
            {showPublicNav && (
              <>
                <div className="flex items-center space-x-1">
                  {navItems.map((item, index) => (
                    <Link key={index} to={item.path}>
                      <Button
                        variant={isActive(item.path) ? "default" : "ghost"}
                        className="hover-scale"
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-6 w-px bg-border"></div>
              </>
            )}

            {/* Auth items */}
            <div className="flex items-center space-x-2">
              {authItems.map((item, index) => (
                <Link key={index} to={item.path}>
                  <Button 
                    variant={isActive(item.path) ? "default" : "outline"}
                    className="hover-scale"
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Button>
                </Link>
              ))}

              {/* Theme toggle */}
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover-scale">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>

              {/* User menu */}
              {isAuthenticated && (
                <>
                  <div className="h-6 w-px bg-border"></div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground hidden lg:block">
                      {user?.name}
                    </span>
                    <Button variant="outline" onClick={handleLogout} className="hover-scale">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Navigation items */}
            {showPublicNav && navItems.map((item, index) => (
              <Link key={index} to={item.path} onClick={() => setIsOpen(false)}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className="w-full justify-start hover-glow"
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            ))}

            {/* Auth items */}
            {authItems.map((item, index) => (
              <Link key={index} to={item.path} onClick={() => setIsOpen(false)}>
                <Button 
                  variant={isActive(item.path) ? "default" : "outline"}
                  className="w-full justify-start hover-glow"
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              </Link>
            ))}

            {/* Theme toggle */}
            <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start hover-glow">
              {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Button>

            {/* User actions */}
            {isAuthenticated && (
              <>
                <div className="pt-2 border-t border-border">
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    Signed in as {user?.name}
                  </div>
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start hover-glow">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
