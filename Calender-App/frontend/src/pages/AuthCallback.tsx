import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { claimToken } from '../lib/api';
import { useAuth } from '../lib/auth';

export function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const claim = searchParams.get('claim');
    const err = searchParams.get('error');

    if (err) {
      setError('Authentication failed. Please try again.');
      return;
    }

    if (!claim) {
      setError('No authentication token received.');
      return;
    }

    claimToken(claim)
      .then((res) => {
        login(res.token, res.user);
        navigate('/dashboard', { replace: true });
      })
      .catch((e) => {
        setError(e.message || 'Failed to complete sign-in.');
      });
  }, [searchParams, login, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="card max-w-md text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900">Sign-in failed</h1>
          <p className="text-sm text-gray-600">{error}</p>
          <a href="/login" className="btn-primary">
            Try again
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        <p className="text-sm text-gray-600">Completing sign-in...</p>
      </div>
    </div>
  );
}
