'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface User {
  username: string
  email: string
  role: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('http://localhost:8000/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    router.push('/')
  }

  if (loading) {
    return <div className={styles.container}>Loading...</div>
  }

  if (!user) return null

  return (
    <div className={styles.container}>
      <h1>Dashboard</h1>
      <div className={styles.userInfo}>
        <h2>Welcome, {user.username}!</h2>
        <p>Email: {user.email}</p>
        <p>Role: <span className={styles.role}>{user.role}</span></p>

        <div className={styles.actions}>
          {user.role === 'admin' && (
            <a href="/admin" className={styles.button}>Admin Panel</a>
          )}
          {(user.role === 'admin' || user.role === 'moderator') && (
            <a href="/moderator" className={styles.button}>Moderator Tools</a>
          )}
          <button onClick={logout} className={styles.logoutButton}>Logout</button>
        </div>
      </div>
    </div>
  )
}
