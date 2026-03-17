import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, FileText, Settings, LogOut,
  Users, AlertOctagon, Zap, ChevronRight, Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const NavItem = ({ path, label, icon: Icon, badge }) => {
  const location = useLocation();
  const isActive = location.pathname === path;

  return (
    <Link to={path}>
      <div className={`sidebar-item group ${isActive ? 'active' : ''}`}>
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">{label}</span>
        {badge && (
          <span className="ml-auto text-xs bg-danger/20 text-danger px-1.5 py-0.5 rounded-md font-semibold">
            {badge}
          </span>
        )}
        {isActive && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
      </div>
    </Link>
  );
};

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const userNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/reports',   label: 'Reports',   icon: FileText },
    { path: '/settings',  label: 'Settings',  icon: Settings },
  ];

  const adminNavItems = [
    { path: '/admin',    label: 'Admin Panel', icon: LayoutDashboard },
    { path: '/reports',  label: 'Reports',     icon: FileText },
    { path: '/settings', label: 'Settings',    icon: Settings },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = (user?.name || user?.username || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-card border-r border-border flex flex-col z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-border flex-shrink-0">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center border border-primary/25 group-hover:bg-primary/25 transition-colors">
            <Shield className="h-4 w-4 text-primary" strokeWidth={2.5} />
          </div>
          <span className="font-bold text-foreground text-base tracking-tight">TypeAware</span>
        </Link>
      </div>

      {/* Status indicator */}
      <div className="px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-security/10 border border-security/20">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-security opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-security" />
          </span>
          <span className="text-xs font-medium text-security">Protection Active</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2 mt-1">
          {isAdmin ? 'Admin' : 'Navigation'}
        </p>
        {navItems.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}

        <div className="pt-4 mt-4 border-t border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-3 py-2">
            Tools
          </p>
          <NavItem path="/demo" label="AI Demo" icon={Zap} />
          <NavItem path="/extension" label="Extension" icon={Activity} />
        </div>
      </nav>

      {/* User section */}
      <div className="p-3 border-t border-border flex-shrink-0">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary mb-1">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/25 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {user?.name || user?.username || 'User'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isAdmin ? 'Administrator' : 'Standard User'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-item w-full hover:bg-danger/10 hover:text-danger"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
