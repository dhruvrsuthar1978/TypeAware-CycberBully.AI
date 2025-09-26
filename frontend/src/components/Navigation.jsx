import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/enhanced-button';
import { 
  Shield, 
  Home, 
  BarChart3, 
  Settings, 
  Moon, 
  Sun, 
  Monitor, 
  LogOut,
  User
} from 'lucide-react';

const Navigation = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                TypeAware
              </span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            {!isAuthenticated ? (
              <div className="flex items-center space-x-2">
                <Link to="/about">
                  <Button variant="ghost" size="sm">About</Button>
                </Link>
                <Link to="/demo">
                  <Button variant="glow" size="sm">Try Demo</Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button variant="hero" size="sm">Sign Up</Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/">
                  <Button 
                    variant={location.pathname === '/' ? 'secondary' : 'ghost'} 
                    size="sm"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Home
                  </Button>
                </Link>
                
                <Link to="/dashboard">
                  <Button 
                    variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'} 
                    size="sm"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>

                {isAdmin && (
                  <Link to="/admin">
                    <Button 
                      variant={location.pathname === '/admin' ? 'secondary' : 'ghost'} 
                      size="sm"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                )}

                <Button variant="ghost" size="sm" onClick={toggleTheme}>
                  {getThemeIcon()}
                </Button>

                <div className="flex items-center space-x-2 pl-2 border-l">
                  <span className="text-sm text-muted-foreground">
                    {user?.name}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {!isAuthenticated && (
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {getThemeIcon()}
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;