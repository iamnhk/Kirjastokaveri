import { Outlet } from 'react-router-dom'

function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container flex min-h-screen items-center justify-center">
        <div className="card max-w-md w-full text-center">
          <h1 className="text-2xl font-semibold text-slate-800 mb-4">Kirjastokaveri</h1>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
