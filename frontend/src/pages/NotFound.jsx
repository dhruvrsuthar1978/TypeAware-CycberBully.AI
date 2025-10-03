import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="relative text-center px-4">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <Shield className="h-20 w-20 text-white/80" />
            <div className="absolute inset-0 bg-white/20 rounded-full blur-xl"></div>
          </div>
        </div>
        
        <h1 className="mb-4 text-6xl md:text-8xl font-bold text-white">404</h1>
        <h2 className="mb-4 text-2xl md:text-3xl font-semibold text-white/90">Page Not Found</h2>
        <p className="mb-8 text-lg text-white/70 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/">
            <Button variant="premium" size="xl" className="min-w-48 group">
              <Home className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              Return Home
            </Button>
          </Link>
          <Button 
            variant="glass" 
            size="xl" 
            className="min-w-48 group" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
