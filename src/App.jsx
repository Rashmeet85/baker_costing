import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { PageSkeleton } from './components/ui/PageSkeleton';
import { SignInPage } from './pages/SignInPage';
import { useAuth } from './context/AuthContext';

const HomePage = lazy(() => import('./pages/HomePage'));
const RecipeDetailPage = lazy(() => import('./pages/RecipeDetailPage'));
const CreateRecipePage = lazy(() => import('./pages/CreateRecipePage'));
const SalesPage = lazy(() => import('./pages/SalesPage'));
const InsightsPage = lazy(() => import('./pages/InsightsPage'));
const IngredientsPage = lazy(() => import('./pages/IngredientsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

function ProtectedApp() {
  return (
    <AppShell>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/calc" element={<HomePage />} />
          <Route path="/recipe/:recipeId" element={<RecipeDetailPage />} />
          <Route path="/create-recipe" element={<CreateRecipePage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/insights" element={<InsightsPage />} />
          <Route path="/ingredients" element={<IngredientsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
}

export default function App() {
  const { initializing, user } = useAuth();

  if (initializing) {
    return <PageSkeleton fullScreen />;
  }

  return user ? <ProtectedApp /> : <SignInPage />;
}
