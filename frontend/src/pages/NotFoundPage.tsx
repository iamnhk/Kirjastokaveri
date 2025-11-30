import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="page-section">
      <div className="page-section__inner flex flex-col items-center gap-md text-center">
        <h1 className="text-3xl font-semibold text-slate-800">Page not found</h1>
        <p className="text-slate-600 max-w-md">
          The view you are looking for does not exist yet. Return to the home page and continue exploring the shell migration.
        </p>
        <Link to="/" className="btn btn-primary">
          Back to home
        </Link>
      </div>
    </section>
  )
}

export default NotFoundPage
