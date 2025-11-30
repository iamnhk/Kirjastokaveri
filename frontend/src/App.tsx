import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AuthProvider } from './contexts/AuthContext'
import { LocationProvider } from './contexts/LocationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import MainLayout from './layouts/MainLayout'
import AuthLayout from './layouts/AuthLayout'
import {
  BrowsePage,
  HomePage,
  ListsPage,
  LoginPage,
  MapPage,
  NotFoundPage,
  SignupPage,
} from './pages'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<HomePage />} />
                <Route path="browse" element={<BrowsePage />} />
                <Route path="lists" element={<ListsPage />} />
                <Route path="map" element={<MapPage />} />
              </Route>

              <Route path="/auth" element={<AuthLayout />}>
                <Route path="login" element={<LoginPage />} />
                <Route path="signup" element={<SignupPage />} />
              </Route>

              <Route path="/home" element={<Navigate to="/" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
