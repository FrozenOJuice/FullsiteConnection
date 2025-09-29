'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface User {
  id: number
  username: string
  email: string
  role: string
}

export default function AdminPanel() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadUsers()
  }, [])

  const checkAuthAndLoadUsers = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // First check if user is admin
      const userResponse = await fetch('http://localhost:8000/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!userResponse.ok) {
        router.push('/login')
        return
      }

      const userData = await userResponse.json()
      if (userData.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      // Load all users
      const usersResponse = await fetch('http://localhost:8000/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users)
      }
    } catch (error) {
      console.error('Failed to load admin panel:', error)
      router.push('/dashboard')
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Panel</h1>
        <div className={styles.nav}>
          <a href="/dashboard" className={styles.button}>Back to Dashboard</a>
          <button onClick={logout} className={styles.logoutButton}>Logout</button>
        </div>
      </div>

      <div className={styles.usersSection}>
        <h2>User Management</h2>
        <div className={styles.usersList}>
          {users.map(user => (
            <div key={user.id} className={styles.userCard}>
              <div className={styles.userInfo}>
                <h3>{user.username}</h3>
                <p>{user.email}</p>
                <span className={`${styles.role} ${styles[user.role]}`}>
                  {user.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
