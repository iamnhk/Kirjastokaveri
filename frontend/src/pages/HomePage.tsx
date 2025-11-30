import { FormEvent, useEffect } from 'react'
import { Link } from 'react-router-dom'

import { usePageLayout } from '../layouts'

const HIGHLIGHTS = [
  { label: 'Libraries tracked', value: '230+' },
  { label: 'Readers onboard', value: '18k' },
  { label: 'Reservation alerts', value: '42k/mo' },
]

const FEATURES = [
  {
    title: 'Seamless discovery',
    description: 'Instantly browse catalogues across Finland with filters for language, format, and availability.',
  },
  {
    title: 'Smart location support',
    description: 'See which branches have copies on the shelf near you and how long it takes to get there.',
  },
  {
    title: 'Personal reading hub',
    description: 'Keep wishlists, current reads, and completed titles in sync across devices.',
  },
  {
    title: 'Stay in the loop',
    description: 'Notifications let you know the moment a reserved title becomes free again.',
  },
]

const ROADMAP = [
  {
    title: 'Search & browse',
    detail: 'Finna catalogue integration with availability and filtering.',
  },
  {
    title: 'Reading lists',
    detail: 'Keep personal lists organised and tracked with due-date reminders.',
  },
  {
    title: 'Location-aware map',
    detail: 'Interactive map of libraries with distance, opening hours, and services.',
  },
]

function HomePage() {
  const { resetLayout } = usePageLayout()

  useEffect(() => {
    resetLayout()
    return () => resetLayout()
  }, [resetLayout])

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    console.warn('Search coming soon')
  }

  return (
    <div className="space-y-24 pb-24">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-sky-50 via-white to-indigo-50">
        <div className="absolute inset-0 -z-10">
          <div className="pointer-events-none absolute -left-20 top-24 h-48 w-48 rounded-full bg-sky-200 opacity-40 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-indigo-200 opacity-30 blur-3xl" />
        </div>

        <div className="mx-auto flex max-w-6xl flex-col gap-16 px-6 py-24 text-center lg:px-8">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex items-center justify-center rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
              Finland&apos;s library companion
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Discover books, manage reservations, and never miss a nearby copy again.
            </h1>
            <p className="mt-6 text-lg text-slate-600">
              Kirjastokaveri keeps your library life organised—from inspiration and search to pick-up reminders and reading history.
            </p>
          </div>

          <form
            onSubmit={handleSearch}
            className="mx-auto flex w-full max-w-2xl flex-col gap-3 rounded-3xl bg-white/90 p-4 shadow-lg shadow-sky-100 backdrop-blur md:flex-row md:items-center"
          >
            <input
              type="text"
              className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
              placeholder="Search the national catalogue"
              name="search"
              autoComplete="off"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:from-sky-600 hover:to-indigo-600 hover:shadow-lg"
            >
              Explore titles
            </button>
          </form>

          <dl className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {HIGHLIGHTS.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-100 bg-white/70 p-6 shadow-sm backdrop-blur">
                <dt className="text-sm font-medium text-slate-500">{item.label}</dt>
                <dd className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-semibold text-slate-900">What you can do with Kirjastokaveri</h2>
          <p className="mt-4 text-lg text-slate-600">
            Built from the research prototype you loved, our next milestone focuses on making these core experiences rock solid.
          </p>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-3xl border border-slate-100 bg-white p-8 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <h3 className="text-xl font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-4 text-base text-slate-600">{feature.description}</p>
              <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-sky-600 opacity-0 transition group-hover:opacity-100">
                Learn more soon
                <span aria-hidden="true">→</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 text-white lg:px-8 lg:flex-row lg:items-center">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold">What we&apos;re shipping next</h2>
            <p className="mt-4 text-lg text-slate-200">
              Each release brings the research prototype closer to production. Here&apos;s what we&apos;re tackling first.
            </p>
          </div>
          <ul className="flex-1 space-y-6">
            {ROADMAP.map((item) => (
              <li key={item.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_-30px_rgba(148,163,184,0.8)]">
                <h3 className="text-xl font-semibold text-white">{item.title}</h3>
                <p className="mt-2 text-base text-slate-200">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 text-center lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 p-[1px]">
          <div className="rounded-3xl bg-white px-8 py-16">
            <h2 className="text-3xl font-semibold text-slate-900">Get ready for the full experience</h2>
            <p className="mt-4 text-lg text-slate-600">
              Preview the live prototype while we connect the dots in this repository.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/browse"
                className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-6 py-3 text-base font-semibold text-white shadow-md transition hover:bg-sky-700 hover:shadow-lg"
              >
                Explore the shell
              </Link>
              <a
                href="https://kirjastokaveri-playground.netlify.app/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-6 py-3 text-base font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Visit research prototype
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
