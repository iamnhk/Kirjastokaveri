import { Link, NavLink } from 'react-router-dom'
import clsx from 'clsx'

import { useAuth } from '../contexts'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/browse', label: 'Browse' },
  { to: '/lists', label: 'My Lists' },
  { to: '/map', label: 'Map' },
]

function Header() {
  const { isAuthenticated } = useAuth()

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-sm text-lg font-semibold text-slate-900">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            📚
          </span>
          Kirjastokaveri
        </Link>

        <nav className="hidden items-center gap-lg text-sm text-slate-600 md:flex">
          {NAV_LINKS.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx('transition-colors hover:text-slate-900', isActive && 'text-sky-600 font-medium')
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-sm">
          {isAuthenticated ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">Signed in</span>
          ) : (
            <Link to="/auth/login" className="btn btn-secondary text-sm">
              Log In
            </Link>
          )}
          <Link to="/auth/signup" className="btn btn-primary text-sm">
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  )
}

export default Header
