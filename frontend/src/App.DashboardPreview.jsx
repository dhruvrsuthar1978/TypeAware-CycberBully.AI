import { useState } from 'react';
import { Button } from './components/ui/button';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Extension from './pages/Extension';
import Demo from './pages/Demo';

const DashboardPreview = () => {
  const [activeView, setActiveView] = useState('demo');

  return (
    <div className="min-h-screen bg-background">
      {/* Toggle Controls */}
      <div className="fixed top-4 right-4 z-50 flex flex-wrap gap-2 bg-card/80 backdrop-blur-xl p-2 rounded-2xl border border-border/50 shadow-elegant max-w-md">
        <Button
          variant={activeView === 'demo' ? 'default' : 'outline'}
          onClick={() => setActiveView('demo')}
          className="hover-scale rounded-xl font-medium text-xs"
          size="sm"
        >
          Demo
        </Button>
        <Button
          variant={activeView === 'login' ? 'default' : 'outline'}
          onClick={() => setActiveView('login')}
          className="hover-scale rounded-xl font-medium text-xs"
          size="sm"
        >
          Login
        </Button>
        <Button
          variant={activeView === 'signup' ? 'default' : 'outline'}
          onClick={() => setActiveView('signup')}
          className="hover-scale rounded-xl font-medium text-xs"
          size="sm"
        >
          Signup
        </Button>
        <Button
          variant={activeView === 'extension' ? 'default' : 'outline'}
          onClick={() => setActiveView('extension')}
          className="hover-scale rounded-xl font-medium text-xs"
          size="sm"
        >
          Extension
        </Button>
        <Button
          variant={activeView === 'about' ? 'default' : 'outline'}
          onClick={() => setActiveView('about')}
          className="hover-scale rounded-xl font-medium text-xs"
          size="sm"
        >
          About
        </Button>
        <Button
          variant={activeView === 'user' ? 'default' : 'outline'}
          onClick={() => setActiveView('user')}
          className="hover-scale rounded-xl font-medium text-xs"
          size="sm"
        >
          User
        </Button>
        <Button
          variant={activeView === 'admin' ? 'default' : 'outline'}
          onClick={() => setActiveView('admin')}
          className="hover-scale rounded-xl font-medium text-xs"
          size="sm"
        >
          Admin
        </Button>
      </div>

      {/* Dashboard Views */}
      {activeView === 'demo' && <Demo />}
      {activeView === 'login' && <Login />}
      {activeView === 'signup' && <Signup />}
      {activeView === 'extension' && <Extension />}
      {activeView === 'about' && <About />}
      {activeView === 'user' && <UserDashboard />}
      {activeView === 'admin' && <AdminDashboard />}
    </div>
  );
};

export default DashboardPreview;