'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (token) {
        // Optional: Validate token with backend
        const response = await fetch('http://localhost:8000/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        setIsAuthenticated(response.ok)
        
        // If authenticated, redirect to dashboard
        if (response.ok) {
          router.push('/dashboard')
        }
      } else {
        setIsAuthenticated(false)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      setIsAuthenticated(false)
    }
  }

  const navigateToDashboard = () => {
    router.push('/dashboard')
  }

  // Show loading while checking auth
  if (isAuthenticated === null) {
    return <div className={styles.container}>Loading...</div>
  }

  // If authenticated, this will redirect automatically
  // But show a message just in case
  if (isAuthenticated) {
    return (
      <div className={styles.container}>
        <h1>Welcome back!</h1>
        <p>Redirecting you to your dashboard...</p>
        <button onClick={navigateToDashboard} className={styles.button}>
          Go to Dashboard Now
        </button>
      </div>
    )
  }

  // Public homepage content
  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <h1>Welcome to Auth App</h1>
        <p>A secure authentication system with role-based access control</p>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <h3>🔐 Secure Authentication</h3>
          <p>JWT-based login with password hashing</p>
        </div>
        <div className={styles.feature}>
          <h3>👥 Role-Based Access</h3>
          <p>User, Moderator, and Admin roles</p>
        </div>
        <div className={styles.feature}>
          <h3>🚀 Fast & Modern</h3>
          <p>Built with FastAPI and Next.js</p>
        </div>
      </div>

      <div className={styles.cta}>
        <h2>Get Started</h2>
        <p>Create an account or log in to access your dashboard</p>
        <div className={styles.buttons}>
          <a href="/register" className={styles.primaryButton}>Sign Up</a>
          <a href="/login" className={styles.secondaryButton}>Login</a>
        </div>
      </div>
    </div>
  )
}