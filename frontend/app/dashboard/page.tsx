// app/dashboard/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './dashboard.module.css'

interface User {
  id: number
  username: string
  email: string
  role: string
  review_stats?: {
    total_reviews: number
    average_rating: number
    helpful_votes_received: number
    watchlist_count: number
  }
  penalties: string[]
}

interface WatchlistItem {
  movie_id: string
  movie_title: string
  movie_year: string
  movie_rating: number
  added_at: string
}

interface Movie {
  id: string
  title: string
  movieIMDbRating: number
  movieGenres: string[]
  datePublished: string
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [recentMovies, setRecentMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Get user info with review stats
      const userResponse = await fetch('http://localhost:8000/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData)
        
        // Load watchlist
        const watchlistResponse = await fetch('http://localhost:8000/movies/user/watchlist', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (watchlistResponse.ok) {
          const watchlistData = await watchlistResponse.json()
          setWatchlist(watchlistData)
        }

        // Load recent movies for recommendations
        const moviesResponse = await fetch('http://localhost:8000/movies/?min_rating=8')
        if (moviesResponse.ok) {
          const moviesData = await moviesResponse.json()
          setRecentMovies(moviesData.slice(0, 6)) // Show top 6 highly rated movies
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  const removeFromWatchlist = async (movieId: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:8000/movies/${movieId}/watchlist`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        setWatchlist(watchlist.filter(item => item.movie_id !== movieId))
        // Refresh user stats
        checkAuthAndLoadData()
      }
    } catch (error) {
      console.error('Failed to remove from watchlist:', error)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>🎬 Your Dashboard</h1>
          <div className={styles.userNav}>
            <span>Welcome back, <strong>{user.username}</strong>!</span>
            <a href="/movies" className={styles.navButton}>Browse Movies</a>
            <button onClick={logout} className={styles.logoutButton}>Logout</button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Sidebar */}
        <div className={styles.sidebar}>
          <div className={styles.userCard}>
            <div className={styles.avatar}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <h3>{user.username}</h3>
            <p className={styles.userEmail}>{user.email}</p>
            <div className={`${styles.role} ${styles[user.role]}`}>
              {user.role.toUpperCase()}
            </div>
          </div>

          <nav className={styles.sidebarNav}>
            <button 
              className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Overview
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'watchlist' ? styles.active : ''}`}
              onClick={() => setActiveTab('watchlist')}
            >
              📝 Watchlist ({user.review_stats?.watchlist_count || 0})
            </button>
            <button 
              className={`${styles.navItem} ${activeTab === 'reviews' ? styles.active : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              ✍️ My Reviews ({user.review_stats?.total_reviews || 0})
            </button>
            
            {user.role === 'admin' && (
              <a href="/admin" className={styles.navItem}>
                ⚙️ Admin Panel
              </a>
            )}
            {(user.role === 'admin' || user.role === 'moderator') && (
              <a href="/moderator" className={styles.navItem}>
                🛠️ Moderator Tools
              </a>
            )}
          </nav>
        </div>

        {/* Content Area */}
        <div className={styles.content}>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className={styles.overview}>
              {/* Stats Cards */}
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>📝</div>
                  <div className={styles.statInfo}>
                    <h3>{user.review_stats?.total_reviews || 0}</h3>
                    <p>Reviews Written</p>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>⭐</div>
                  <div className={styles.statInfo}>
                    <h3>{user.review_stats?.average_rating || 0}</h3>
                    <p>Average Rating</p>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>👍</div>
                  <div className={styles.statInfo}>
                    <h3>{user.review_stats?.helpful_votes_received || 0}</h3>
                    <p>Helpful Votes</p>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>🎯</div>
                  <div className={styles.statInfo}>
                    <h3>{user.review_stats?.watchlist_count || 0}</h3>
                    <p>Watchlist Items</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className={styles.section}>
                <h2>Quick Actions</h2>
                <div className={styles.actionsGrid}>
                  <a href="/movies" className={styles.actionCard}>
                    <div className={styles.actionIcon}>🎬</div>
                    <h3>Browse Movies</h3>
                    <p>Discover new movies to watch and review</p>
                  </a>
                  
                  <a href="/movies?min_rating=8" className={styles.actionCard}>
                    <div className={styles.actionIcon}>🔥</div>
                    <h3>Top Rated</h3>
                    <p>Check out the highest rated movies</p>
                  </a>
                  
                  <div className={styles.actionCard} onClick={() => setActiveTab('watchlist')}>
                    <div className={styles.actionIcon}>📝</div>
                    <h3>My Watchlist</h3>
                    <p>View your saved movies</p>
                  </div>
                  
                  <div className={styles.actionCard} onClick={() => setActiveTab('reviews')}>
                    <div className={styles.actionIcon}>✍️</div>
                    <h3>My Reviews</h3>
                    <p>See all your reviews</p>
                  </div>
                </div>
              </div>

              {/* Recommended Movies */}
              {recentMovies.length > 0 && (
                <div className={styles.section}>
                  <h2>Highly Rated Movies</h2>
                  <div className={styles.moviesGrid}>
                    {recentMovies.map(movie => (
                      <div key={movie.id} className={styles.movieCard}>
                        <div className={styles.movieHeader}>
                          <h4>{movie.title}</h4>
                          <div className={styles.rating}>⭐ {movie.movieIMDbRating}</div>
                        </div>
                        <p className={styles.movieYear}>{movie.datePublished.split('-')[0]}</p>
                        <div className={styles.genres}>
                          {movie.movieGenres.slice(0, 2).map(genre => (
                            <span key={genre} className={styles.genreTag}>{genre}</span>
                          ))}
                        </div>
                        <a 
                          href={`/movies/${movie.id}`} 
                          className={styles.viewButton}
                        >
                          View Details
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Penalties Section */}
              {user.penalties && user.penalties.length > 0 && (
                <div className={styles.section}>
                  <h2>⚠️ Active Penalties</h2>
                  <div className={styles.penaltiesList}>
                    {user.penalties.map((penalty, index) => (
                      <div key={index} className={styles.penaltyCard}>
                        <div className={styles.penaltyIcon}>🚩</div>
                        <div className={styles.penaltyText}>
                          {penalty}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Watchlist Tab */}
          {activeTab === 'watchlist' && (
            <div className={styles.watchlistTab}>
              <h2>My Watchlist ({watchlist.length})</h2>
              
              {watchlist.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📝</div>
                  <h3>Your watchlist is empty</h3>
                  <p>Start adding movies you want to watch later!</p>
                  <a href="/movies" className={styles.primaryButton}>
                    Browse Movies
                  </a>
                </div>
              ) : (
                <div className={styles.watchlistGrid}>
                  {watchlist.map(item => (
                    <div key={item.movie_id} className={styles.watchlistCard}>
                      <div className={styles.watchlistHeader}>
                        <h4>{item.movie_title}</h4>
                        <div className={styles.rating}>⭐ {item.movie_rating}</div>
                      </div>
                      <p className={styles.movieYear}>{item.movie_year}</p>
                      <p className={styles.addedDate}>
                        Added on {new Date(item.added_at).toLocaleDateString()}
                      </p>
                      <div className={styles.watchlistActions}>
                        <a 
                          href={`/movies/${item.movie_id}`} 
                          className={styles.viewButton}
                        >
                          View Movie
                        </a>
                        <button 
                          onClick={() => removeFromWatchlist(item.movie_id)}
                          className={styles.removeButton}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div className={styles.reviewsTab}>
              <h2>My Reviews</h2>
              
              {(!user.review_stats || user.review_stats.total_reviews === 0) ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>✍️</div>
                  <h3>You haven't written any reviews yet</h3>
                  <p>Start sharing your thoughts on movies!</p>
                  <a href="/movies" className={styles.primaryButton}>
                    Browse Movies
                  </a>
                </div>
              ) : (
                <div className={styles.reviewsStats}>
                  <div className={styles.reviewSummary}>
                    <h3>Review Summary</h3>
                    <p>You've written <strong>{user.review_stats.total_reviews}</strong> reviews with an average rating of <strong>{user.review_stats.average_rating}/10</strong></p>
                    <p>Your reviews received <strong>{user.review_stats.helpful_votes_received}</strong> helpful votes</p>
                  </div>
                  <div className={styles.comingSoon}>
                    <h4>🎯 Coming Soon</h4>
                    <p>Detailed review history and management will be available in the next update!</p>
                    <a href="/movies" className={styles.secondaryButton}>
                      Write More Reviews
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}