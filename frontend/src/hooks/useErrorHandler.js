import { useToast } from '@/hooks/use-toast';
import { getErrorDetails, getErrorSeverity } from '@/utils/errorCodes';

export const useErrorHandler = () => {
  const { toast } = useToast();

  const handleError = (error, customMessage) => {
    console.error('Error:', error);

    // Get error code from response or default to generic error
    const errorCode = error?.response?.status || 500;
    const errorDetails = getErrorDetails(error?.code);
    const severity = getErrorSeverity(errorCode);

    // Show toast notification
    toast({
      title: customMessage || errorDetails.message,
      description: error?.message || 'Please try again or contact support if the problem persists.',
      variant: severity === 'critical' ? 'destructive' : 'default',
      duration: severity === 'critical' ? 8000 : 5000,
    });

    // Log error to monitoring service (if configured)
    if (process.env.NODE_ENV === 'production') {
      // TODO: Add error logging service integration
      // Example: Sentry.captureException(error);
    }

    // Return error details for additional handling if needed
    return {
      code: errorCode,
      message: errorDetails.message,
      severity,
      details: error
    };
  };

  const isAuthError = (error) => {
    return error?.response?.status === 401 || error?.response?.status === 403;
  };

  const isNetworkError = (error) => {
    return !error?.response && !error?.request;
  };

  const isTimeoutError = (error) => {
    return error?.code === 'ECONNABORTED';
  };

  return {
    handleError,
    isAuthError,
    isNetworkError,
    isTimeoutError
  };
};