import { HashRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { BooksProvider } from './contexts/BooksContext';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from './components/ui/sonner';
import { AvailabilityMonitor } from './components/system/AvailabilityMonitor';

// Lazy load pages for better code splitting
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Browse = lazy(() => import('./pages/Browse').then(m => ({ default: m.Browse })));
const MyLists = lazy(() => import('./pages/MyLists').then(m => ({ default: m.MyLists })));

// Simple loading fallback
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BooksProvider>
          <NotificationProvider>
            <AvailabilityMonitor />
            <HashRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/my-lists" element={<MyLists />} />
                </Routes>
              </Suspense>
            </HashRouter>
            <Toaster />
          </NotificationProvider>
        </BooksProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}