import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { cancelByToken } from '../lib/api';

export function CancelPage() {
  const { cancelToken } = useParams<{ cancelToken: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!cancelToken) {
      setStatus('error');
      setMessage('No cancellation token provided.');
      return;
    }

    cancelByToken(cancelToken)
      .then((res) => {
        setStatus('success');
        setMessage(res.message || 'Your booking has been cancelled.');
      })
      .catch((e) => {
        setStatus('error');
        setMessage(e.message || 'Failed to cancel booking.');
      });
  }, [cancelToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
      <div className="card max-w-md text-center space-y-4 mx-6">
        {status === 'loading' && (
          <>
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
            <p className="text-sm text-gray-600">Cancelling your booking...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
              ✓
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Booking Cancelled</h1>
            <p className="text-sm text-gray-600">{message}</p>
            <p className="text-xs text-gray-400">
              A confirmation email has been sent. If you need to reschedule, please visit the booking page again.
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="text-4xl">⚠️</div>
            <h1 className="text-xl font-semibold text-gray-900">Cancellation Failed</h1>
            <p className="text-sm text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
