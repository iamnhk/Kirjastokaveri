import { NavLink, Outlet } from 'react-router-dom'

function MainLayout() {
  return (
    <div className="page-shell">
      <header className="bg-white shadow">
        <div className="container flex items-center justify-between py-4">
          <NavLink to="/" className="text-lg font-semibold text-sky-600">
            Kirjastokaveri
          </NavLink>
          <nav className="flex gap-sm text-sm text-slate-600">
            <NavLink to="/browse" className={({ isActive }) => (isActive ? 'text-sky-600' : 'hover:text-sky-600')}>
              Browse
            </NavLink>
            <NavLink to="/lists" className={({ isActive }) => (isActive ? 'text-sky-600' : 'hover:text-sky-600')}>
              Lists
            </NavLink>
            <NavLink to="/map" className={({ isActive }) => (isActive ? 'text-sky-600' : 'hover:text-sky-600')}>
              Map
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="page-shell__content">
        <Outlet />
      </main>

      <footer className="container mt-auto py-8 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Kirjastokaveri. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default MainLayout
