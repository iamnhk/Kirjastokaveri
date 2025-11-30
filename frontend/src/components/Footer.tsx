function Footer() {
  return (
    <footer className="bg-slate-900 py-8 text-slate-300">
      <div className="container flex flex-col gap-sm text-sm md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} Kirjastokaveri. Crafted for library explorers.</p>
        <p className="text-slate-500">Shell build – feature modules arriving in subsequent branches.</p>
      </div>
    </footer>
  )
}

export default Footer
