import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export const CalendarCallback: React.FC = () => {
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (window.opener) {
      // This is a popup window, send message to parent
      if (code) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_CALENDAR_AUTH_SUCCESS',
            code: code,
          },
          window.location.origin
        );
      } else if (error) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_CALENDAR_AUTH_ERROR',
            error: error,
          },
          window.location.origin
        );
      } else {
        window.opener.postMessage(
          {
            type: 'GOOGLE_CALENDAR_AUTH_ERROR',
            error: 'No authorization code received',
          },
          window.location.origin
        );
      }

      // Close the popup
      window.close();
    } else {
      // This is not a popup, handle as regular page
      if (code) {
        // Store the code and redirect to settings or show success message
        sessionStorage.setItem('google_calendar_code', code);
        window.location.href = '/settings?calendar=success';
      } else if (error) {
        window.location.href = `/settings?calendar=error&message=${encodeURIComponent(error)}`;
      } else {
        window.location.href =
          '/settings?calendar=error&message=No authorization code received';
      }
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Connecting Calendar
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Please wait while we connect your Google Calendar...
          </p>
        </div>
      </div>
    </div>
  );
};
