import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface AuthContextValue {
  isAuthenticated: boolean
  user: { username: string } | null
  login: () => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<{ username: string } | null>(null)

  const value = useMemo<AuthContextValue>(() => ({
    isAuthenticated: Boolean(user),
    user,
    login: () => {
      console.warn('Auth login stub: replace when backend auth lands')
      setUser({ username: 'demo.user' })
    },
    logout: () => {
      console.warn('Auth logout stub: replace when backend auth lands')
      setUser(null)
    },
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
