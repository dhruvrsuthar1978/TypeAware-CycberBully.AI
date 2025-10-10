import React from 'react';
import { Shield, RefreshCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Log error to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error logging service integration
      // Example: Sentry.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-lg w-full p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Shield className="h-20 w-20 text-primary" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              </div>
            </div>

            <h1 className="text-3xl font-bold text-foreground">Something went wrong</h1>
            
            <p className="text-muted-foreground">
              We apologize for the inconvenience. An unexpected error has occurred.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left p-4 bg-muted/30 rounded-lg overflow-auto max-h-48">
                <p className="text-sm font-mono text-muted-foreground">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => window.location.reload()}
                variant="outline"
                className="group"
              >
                <RefreshCcw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform" />
                Refresh Page
              </Button>

              <Link to="/">
                <Button variant="default" className="group">
                  <Home className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                  Return Home
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}