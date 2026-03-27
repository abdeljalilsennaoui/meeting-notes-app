import { useState, useId } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { logIn } from '../services/authService'

export default function Login() {
  const id = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await logIn(email, password)
      navigate('/dashboard')
    } catch {
      setError('Wrong email or password. Give it another try.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Good to see you</h1>
          <p className="auth-card__subtitle">Log back in to your notes and tasks.</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

        <form onSubmit={handleSubmit} className="auth-card__form" noValidate>
          <div className="form-field">
            <label htmlFor={`${id}-email`} className="form-label">Email</label>
            <input
              id={`${id}-email`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hi@yourcompany.com"
              required
              autoComplete="email"
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label htmlFor={`${id}-password`} className="form-label">Password</label>
            <div className="form-input-wrapper">
              <input
                id={`${id}-password`}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
                className="form-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="form-eye-btn"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-card__submit">
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <p className="auth-card__footer">
          Don&apos;t have an account?{' '}
          <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
