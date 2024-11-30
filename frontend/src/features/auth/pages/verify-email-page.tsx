// frontend/src/features/auth/pages/verify-email-page.tsx
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/contexts/auth-context';
import { authService } from '@/features/auth/services/auth-service';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2, Mail } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function VerifyEmailPage() {
  // const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  // const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      verifyEmail(token);
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    setVerifying(true);
    setError('');
    try {
      await authService.verifyEmail(token);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  // const handleResendVerification = async () => {
  //   setLoading(true);
  //   setError('');
  //   try {
  //     await authService.resendVerification();
  //     setSuccess(true);
  //   } catch (err: any) {
  //     setError(err.response?.data?.message || 'Failed to resend verification email');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  if (verifying) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-4">Verifying your email...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-16 px-4 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <h1 className="text-2xl font-bold mt-4">Email Verified!</h1>
        <p className="mt-2 text-muted-foreground">
          Your email has been successfully verified.
        </p>
        <Link to="/login">
          <Button className="mt-4">Continue to Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 px-4 text-center">
      <Mail className="h-12 w-12 mx-auto text-primary" />
      <h1 className="text-2xl font-bold mt-4">Verify your email</h1>
      <p className="mt-2 text-muted-foreground">
        We sent a verification email to {user?.email}.
        Please check your inbox and click the verification link.
      </p>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* <Button
        variant="outline"
        className="mt-4"
        onClick={handleResendVerification}
        disabled={loading}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Resend verification email
      </Button> */}

      <p className="mt-4 text-sm text-muted-foreground">
        <Link to="/login" className="text-primary hover:underline">
          Return to login
        </Link>
      </p>
    </div>
  );
}