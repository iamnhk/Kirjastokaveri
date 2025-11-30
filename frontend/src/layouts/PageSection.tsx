import type { ReactNode } from 'react'

interface PageSectionProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

function PageSection({ title, subtitle, actions, children, className = '' }: PageSectionProps) {
  return (
    <section className={`page-section ${className}`.trim()}>
      <div className="page-section__inner">
        {(title || subtitle || actions) && (
          <header className="flex flex-col gap-sm mb-6 md:mb-8">
            {title ? <h2 className="text-2xl font-semibold text-slate-800">{title}</h2> : null}
            {subtitle ? <p className="text-slate-600 max-w-2xl">{subtitle}</p> : null}
            {actions ? <div className="mt-sm flex flex-wrap gap-sm">{actions}</div> : null}
          </header>
        )}
        {children}
      </div>
    </section>
  )
}

export default PageSection
