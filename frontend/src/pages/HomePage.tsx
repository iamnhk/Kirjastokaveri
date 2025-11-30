import { useEffect } from 'react'
import { Link } from 'react-router-dom'

import { PageHero, PageSection, usePageLayout } from '../layouts'

function HomePage() {
  const { setLayout, resetLayout } = usePageLayout()

  useEffect(() => {
    setLayout({
      hero: (
        <PageHero
          align="center"
          eyebrow="Library companion"
          title="Welcome to Kirjastokaveri"
          subtitle="Discover nearby libraries, browse the catalogue, and keep your reading list organised. Full experience coming soon."
          actions={<Link to="/browse" className="btn btn-primary">Start browsing</Link>}
        />
      ),
      useContentWrapper: true,
    })

    return () => {
      resetLayout()
    }
  }, [resetLayout, setLayout])

  return (
    <PageSection
      title="What comes next"
      subtitle="The shell is in place. Search, lists, reservations, and notifications will arrive once their feature branches merge."
    >
      <ul className="grid gap-lg md:grid-cols-3">
        <li className="card text-left">
          <h3 className="text-lg font-semibold text-slate-800">Catalogue search</h3>
          <p className="text-slate-600">Browse and filter your favourite titles once the migration brings the Finna integration across.</p>
        </li>
        <li className="card text-left">
          <h3 className="text-lg font-semibold text-slate-800">Reading lists</h3>
          <p className="text-slate-600">Wishlist and reservations sync with the backend in the library-workflows milestone.</p>
        </li>
        <li className="card text-left">
          <h3 className="text-lg font-semibold text-slate-800">Availability alerts</h3>
          <p className="text-slate-600">Background notification services will go live in the observability & notifications phase.</p>
        </li>
      </ul>
    </PageSection>
  )
}

export default HomePage
