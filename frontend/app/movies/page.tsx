// app/movies/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import styles from './movies.module.css'

interface Movie {
  id: string
  title: string
  movieIMDbRating: number
  movieGenres: string[]
  datePublished: string
  description: string
  directors: string[]
}

interface User {
  username: string
  role: string
}

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [filteredMovies, setFilteredMovies] = useState<Movie[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [minRating, setMinRating] = useState(0)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoadMovies()
  }, [])

  useEffect(() => {
    filterMovies()
  }, [movies, searchTerm, selectedGenre, minRating])

  const checkAuthAndLoadMovies = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      // Get user info
      const userResponse = await fetch('http://localhost:8000/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData)
      } else {
        router.push('/login')
        return
      }

      // Load movies
      const moviesResponse = await fetch('http://localhost:8000/movies/')
      if (moviesResponse.ok) {
        const moviesData = await moviesResponse.json()
        setMovies(moviesData)
      }
    } catch (error) {
      console.error('Failed to load movies:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const filterMovies = () => {
    let filtered = movies

    if (searchTerm) {
      filtered = filtered.filter(movie => 
        movie.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedGenre) {
      filtered = filtered.filter(movie =>
        movie.movieGenres.some(genre => 
          genre.toLowerCase().includes(selectedGenre.toLowerCase())
        )
      )
    }

    if (minRating > 0) {
      filtered = filtered.filter(movie => movie.movieIMDbRating >= minRating)
    }

    setFilteredMovies(filtered)
  }

  const getUniqueGenres = () => {
    const allGenres = movies.flatMap(movie => movie.movieGenres)
    return [...new Set(allGenres)]
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    router.push('/')
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading movies...</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <h1>🎬 MovieReviews</h1>
          <div className={styles.userNav}>
            <span>Welcome, {user?.username}!</span>
            <a href="/dashboard" className={styles.navButton}>Dashboard</a>
            <button onClick={logout} className={styles.logoutButton}>Logout</button>
          </div>
        </div>
      </header>

      {/* Search and Filters */}
      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search movies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <select 
            value={selectedGenre} 
            onChange={(e) => setSelectedGenre(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All Genres</option>
            {getUniqueGenres().map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>

          <select 
            value={minRating} 
            onChange={(e) => setMinRating(Number(e.target.value))}
            className={styles.filterSelect}
          >
            <option value="0">Any Rating</option>
            <option value="8">8+ Stars</option>
            <option value="7">7+ Stars</option>
            <option value="6">6+ Stars</option>
            <option value="5">5+ Stars</option>
          </select>
        </div>
      </div>

      {/* Movies Grid */}
      <div className={styles.moviesGrid}>
        {filteredMovies.map(movie => (
          <div key={movie.id} className={styles.movieCard}>
            <div className={styles.movieHeader}>
              <h3 className={styles.movieTitle}>{movie.title}</h3>
              <div className={styles.rating}>
                ⭐ {movie.movieIMDbRating}
              </div>
            </div>
            
            <div className={styles.movieMeta}>
              <span className={styles.year}>{movie.datePublished.split('-')[0]}</span>
              <span className={styles.director}>Dir: {movie.directors[0]}</span>
            </div>

            <div className={styles.genres}>
              {movie.movieGenres.map(genre => (
                <span key={genre} className={styles.genreTag}>{genre}</span>
              ))}
            </div>

            <p className={styles.description}>
              {movie.description.length > 120 
                ? `${movie.description.substring(0, 120)}...` 
                : movie.description
              }
            </p>

            <div className={styles.movieActions}>
              <a 
                href={`/movies/${movie.id}`} 
                className={styles.primaryButton}
              >
                View Details
              </a>
              <button className={styles.secondaryButton}>
                Add to Watchlist
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredMovies.length === 0 && (
        <div className={styles.noResults}>
          <h3>No movies found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}