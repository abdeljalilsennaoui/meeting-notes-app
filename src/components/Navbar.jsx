// Top nav. Shows different links depending on whether the user is signed in.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logOut } from '../services/authService'

export default function Navbar() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await logOut()
    setMobileOpen(false)
    navigate('/login')
  }

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-text">Ambiguity to Action</span>
        </Link>

        <nav className="navbar__nav">
          {user ? (
            <>
              <span className="navbar__email">{user.email}</span>
              <Link to="/dashboard" className="navbar__link">Dashboard</Link>
              <button onClick={handleLogout} className="navbar__logout">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar__link">Sign in</Link>
              <Link to="/signup" className="navbar__link navbar__link--primary">Get started</Link>
            </>
          )}
        </nav>

        <button
          onClick={() => setMobileOpen((o) => !o)}
          className="navbar__hamburger"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="navbar__mobile-menu">
          {user ? (
            <nav className="navbar__mobile-nav">
              <p className="navbar__mobile-email">{user.email}</p>
              <Link to="/dashboard" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Dashboard</Link>
              <button onClick={handleLogout} className="navbar__mobile-logout">Log out</button>
            </nav>
          ) : (
            <nav className="navbar__mobile-nav">
              <Link to="/login" className="navbar__mobile-link" onClick={() => setMobileOpen(false)}>Sign in</Link>
              <Link to="/signup" className="navbar__mobile-link navbar__mobile-link--primary" onClick={() => setMobileOpen(false)}>Get started</Link>
            </nav>
          )}
        </div>
      )}
    </header>
  )
}
