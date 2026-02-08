'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f6',
          padding: '1rem',
        }}>
          <div style={{
            maxWidth: '32rem',
            width: '100%',
            textAlign: 'center',
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            padding: '2rem',
          }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
            }}>
              Critical Error
            </h1>
            <p style={{
              color: '#6b7280',
              marginBottom: '1.5rem',
            }}>
              A critical error occurred. Please try refreshing the page.
            </p>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}>
              <button
                onClick={reset}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '1rem',
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Try Again
              </button>
              <a
                href="/dashboard"
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '0.5rem',
                  border: '1px solid #d1d5db',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '1rem',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
