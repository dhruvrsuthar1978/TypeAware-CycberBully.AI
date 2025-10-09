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
    <nav className="fixed top-0 w-full z-50 bg-card/60 backdrop-blur-2xl border-b border-border/30 shadow-elegant">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 hover-glow rounded-xl p-2 -m-2 group">
            <div className="relative">
              <Shield className="h-9 w-9 text-primary group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-30 blur-md group-hover:opacity-50 transition-opacity"></div>
            </div>
            <span className="text-2xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
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
          <div className="hidden md:flex items-center space-x-2">
            {/* Navigation items */}
            {showPublicNav && (
              <>
                <div className="flex items-center space-x-1">
                  {navItems.map((item, index) => (
                    <Link key={index} to={item.path}>
                      <Button
                        variant={isActive(item.path) ? "default" : "ghost"}
                        className="hover-scale rounded-xl font-medium transition-all"
                        size="default"
                      >
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.label}
                      </Button>
                    </Link>
                  ))}
                </div>

                {/* Divider */}
                <div className="h-8 w-px bg-gradient-primary opacity-30 mx-2"></div>
              </>
            )}

            {/* Auth items */}
            <div className="flex items-center space-x-2">
              {authItems.map((item, index) => (
                <Link key={index} to={item.path}>
                  <Button 
                    variant={isActive(item.path) ? "default" : "outline"}
                    className="hover-scale rounded-xl font-medium transition-all relative overflow-hidden group"
                    size="default"
                  >
                    <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity"></div>
                    <item.icon className="h-4 w-4 mr-2 relative z-10" />
                    <span className="relative z-10">{item.label}</span>
                  </Button>
                </Link>
              ))}

              {/* Theme toggle */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme} 
                className="hover-scale rounded-xl w-10 h-10 transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity"></div>
                {isDark ? <Sun className="h-5 w-5 relative z-10" /> : <Moon className="h-5 w-5 relative z-10" />}
              </Button>

              {/* User menu */}
              {isAuthenticated && (
                <>
                  <div className="h-8 w-px bg-gradient-primary opacity-30 mx-2"></div>
                  <div className="flex items-center space-x-3">
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg shadow-green-500/50"></div>
                      <span className="text-sm font-medium text-foreground">
                        {user?.name}
                      </span>
                    </div>
                    <Button variant="outline" onClick={handleLogout} className="hover-scale rounded-xl font-medium transition-all relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-10 transition-opacity"></div>
                      <LogOut className="h-4 w-4 mr-2 relative z-10" />
                      <span className="relative z-10">Logout</span>
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
        <div className="md:hidden border-t border-border/50 bg-card/95 backdrop-blur-2xl">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {/* Navigation items */}
            {showPublicNav && navItems.map((item, index) => (
              <Link key={index} to={item.path} onClick={() => setIsOpen(false)}>
                <Button
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  className="w-full justify-start hover-glow rounded-xl font-medium h-12"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Button>
              </Link>
            ))}

            {/* Auth items */}
            {authItems.map((item, index) => (
              <Link key={index} to={item.path} onClick={() => setIsOpen(false)}>
                <Button 
                  variant={isActive(item.path) ? "default" : "outline"}
                  className="w-full justify-start hover-glow rounded-xl font-medium h-12"
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Button>
              </Link>
            ))}

            {/* Theme toggle */}
            <Button variant="ghost" onClick={toggleTheme} className="w-full justify-start hover-glow rounded-xl font-medium h-12">
              {isDark ? <Sun className="h-5 w-5 mr-3" /> : <Moon className="h-5 w-5 mr-3" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Button>

            {/* User actions */}
            {isAuthenticated && (
              <>
                <div className="pt-4 mt-4 border-t border-border/50">
                  <div className="px-4 py-3 rounded-xl bg-primary/10 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-foreground">
                        Signed in as {user?.name}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={handleLogout} className="w-full justify-start hover-glow rounded-xl font-medium h-12">
                    <LogOut className="h-5 w-5 mr-3" />
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