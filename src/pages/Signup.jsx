import { useState, useId } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { signUp } from '../services/authService'

export default function Signup() {
  const id = useId()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      await signUp(email, password)
      navigate('/dashboard')
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('That email is already taken. Try logging in instead.')
      } else {
        setError('Something went wrong. Try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__header">
          <h1 className="auth-card__title">Create your account</h1>
          <p className="auth-card__subtitle">Takes about 10 seconds.</p>
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
                placeholder="Create a password"
                required
                autoComplete="new-password"
                className="form-input"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="form-eye-btn" tabIndex={-1}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor={`${id}-confirm`} className="form-label">Confirm Password</label>
            <div className="form-input-wrapper">
              <input
                id={`${id}-confirm`}
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
                className="form-input"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="form-eye-btn" tabIndex={-1}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-card__submit">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-card__footer">
          Already have an account?{' '}
          <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  )
}
