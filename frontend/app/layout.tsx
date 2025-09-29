'use client'

import { useState, useEffect } from 'react'
import './globals.css'

/*
export const metadata = {
  title: 'Auth App',
  description: 'Authentication with FastAPI',
}
*/

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token')
    setIsAuthenticated(!!token)
  }, [])

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, fontFamily: 'Arial, sans-serif' }}>
        <nav style={{ 
          padding: '1rem', 
          backgroundColor: '#f0f0f0', 
          borderBottom: '1px solid #ccc',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <a href="/" style={{ marginRight: '1rem', fontWeight: 'bold' }}>Auth App</a>
          </div>
          <div>
            {isAuthenticated ? (
              <>
                <a href="/dashboard" style={{ marginRight: '1rem' }}>Dashboard</a>
                <a href="/" onClick={() => {
                  localStorage.removeItem('token')
                  setIsAuthenticated(false)
                }}>Logout</a>
              </>
            ) : (
              <>
                <a href="/login" style={{ marginRight: '1rem' }}>Login</a>
                <a href="/register">Register</a>
              </>
            )}
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}