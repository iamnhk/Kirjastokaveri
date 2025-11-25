import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Kirjastokaveri
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Your library companion - Full Stack Application
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
