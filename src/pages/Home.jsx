// Landing page. CTA sends signed-in users to the dashboard, everyone else to signup.
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Zap, CheckCircle, LayoutDashboard } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const features = [
  { Icon: Zap, title: 'Catches vague language', body: 'Words like "someone", "soon" or "maybe" get flagged the second you type them.' },
  { Icon: CheckCircle, title: 'Forces real tasks', body: 'You have to name an owner and pick a date. No owner, no task.' },
  { Icon: LayoutDashboard, title: 'Everything in one place', body: 'Your tasks and notes live in notebooks. Easy to find, easy to act on.' },
]

const steps = [
  { step: '01', title: 'Write or paste your notes', body: 'Type straight into the app or paste from anywhere. No formatting needed.' },
  { step: '02', title: 'See what needs fixing', body: 'Vague words light up as you type so you know exactly what to clarify.' },
  { step: '03', title: 'Turn it into a task', body: 'Pick an owner, set a date and save. Done.' },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="home">
      <motion.div
        className="home__hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
      >
        <span className="home__badge">HCI Project</span>
        <h1 className="home__title">
          Stop letting meeting notes die in a doc
        </h1>
        <p className="home__subtitle">
          Write your notes, catch the vague stuff before it causes confusion, and turn action items into real tasks with a name and a date on them.
        </p>
        <div className="home__cta">
          <Link to={user ? '/dashboard' : '/signup'} className="home__cta-primary">
            {user ? 'Go to Dashboard →' : 'Get started'}
          </Link>
          {!user && (
            <Link to="/login" className="home__cta-secondary">Sign in</Link>
          )}
        </div>
      </motion.div>

      <div className="home__features">
        {features.map(({ Icon, title, body }, i) => (
          <motion.div
            key={title}
            className="feature-card"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.1 * (i + 1) }}
          >
            <span className="feature-card__icon"><Icon size={22} /></span>
            <h3 className="feature-card__title">{title}</h3>
            <p className="feature-card__body">{body}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="home__how"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.4 }}
      >
        <h2 className="home__how-title">How it works</h2>
        <div className="home__how-steps">
          {steps.map(({ step, title, body }) => (
            <div key={step} className="how-step">
              <span className="how-step__number">{step}</span>
              <div>
                <p className="how-step__title">{title}</p>
                <p className="how-step__body">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
