import type { ReactNode } from 'react'

interface PageHeroProps {
  eyebrow?: string
  title: string
  subtitle?: string
  actions?: ReactNode
  align?: 'left' | 'center'
}

function PageHero({ eyebrow, title, subtitle, actions, align = 'left' }: PageHeroProps) {
  const alignmentClass = align === 'center' ? 'page-hero--centered' : ''

  return (
    <section className={`page-hero ${alignmentClass}`.trim()}>
      <div className="page-hero__inner">
        <div className="page-hero__copy">
          {eyebrow ? <span className="page-hero__eyebrow">{eyebrow}</span> : null}
          <h1 className="page-hero__title">{title}</h1>
          {subtitle ? <p className="page-hero__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="page-hero__actions">{actions}</div> : null}
      </div>
    </section>
  )
}

export default PageHero
