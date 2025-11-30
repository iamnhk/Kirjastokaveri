import { useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { Footer, Header } from '../components'

export interface PageLayoutConfig {
  hero?: React.ReactNode
  afterContent?: React.ReactNode
  contentClassName?: string
  useContentWrapper?: boolean
}

export interface LayoutControls {
  setLayout: (config: Partial<PageLayoutConfig>) => void
  resetLayout: () => void
}

const DEFAULT_LAYOUT: PageLayoutConfig = {
  hero: null,
  afterContent: null,
  contentClassName: '',
  useContentWrapper: false,
}

function MainLayout() {
  const [layout, setLayout] = useState<PageLayoutConfig>(DEFAULT_LAYOUT)
  const location = useLocation()

  const setLayoutConfig = useCallback((config: Partial<PageLayoutConfig>) => {
    setLayout((prev) => ({ ...prev, ...config }))
  }, [])

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    resetLayout()
  }, [location.pathname, resetLayout])

  const outletContext = useMemo<LayoutControls>(
    () => ({ setLayout: setLayoutConfig, resetLayout }),
    [setLayoutConfig, resetLayout],
  )

  const renderedContent = layout.useContentWrapper === false
    ? <Outlet context={outletContext} />
    : (
      <section className="page-section">
        <div className={`page-section__inner ${layout.contentClassName ?? ''}`.trim()}>
          <Outlet context={outletContext} />
        </div>
      </section>
    )

  return (
    <div className="page-shell">
      <Header />
      <main className="page-shell__content">
        {layout.hero}
        {renderedContent}
        {layout.afterContent}
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
