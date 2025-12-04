import { Navigate, useLocation } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { MyListsAuthenticated } from '../components/my-lists';
import { useThemeTokens } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader } from '../components/layout/PageHeader';

export function MyLists() {
  const { currentTheme } = useThemeTokens();
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <Layout>
      <div className={`min-h-screen ${currentTheme.bg} py-6 md:py-16`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <PageHeader
            title="My Lists"
            description="Manage your reading journey"
            currentTheme={currentTheme}
          />

          <MyListsAuthenticated />
        </div>
      </div>
    </Layout>
  );
}