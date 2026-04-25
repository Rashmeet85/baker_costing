import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { PageSkeleton } from './components/ui/PageSkeleton';
import { SignInPage } from './pages/SignInPage';
import { useAuth } from './context/AuthContext';
import { useBakery } from './context/BakeryContext';

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
  const { initializing, user, signOut } = useAuth();
  const { hasBusinessAccess, roleLoading } = useBakery();

  if (initializing) {
    return <PageSkeleton fullScreen />;
  }

  if (user && roleLoading) {
    return <PageSkeleton fullScreen />;
  }

  if (user && !hasBusinessAccess) {
    return (
      <main className="app-shell" style={{ display: 'grid', alignItems: 'center' }}>
        <section className="glass-card hero-card stack" style={{ minHeight: 360 }}>
          <div className="pill" style={{ width: 'fit-content' }}>Access pending</div>
          <div>
            <h1 className="page-title">You’re signed in, but this account doesn’t have bakery access yet.</h1>
            <p className="page-subtitle" style={{ maxWidth: 340 }}>
              Ask the owner to add your email in the shared Firestore `roles` collection as `viewer`, `admin`, or `coowner`.
            </p>
          </div>
          <div className="glass-card surface-card stack-sm" style={{ marginTop: 'auto' }}>
            <strong>{user.email}</strong>
            <span className="muted">Once your role doc is added, refresh or sign in again.</span>
            <button type="button" className="button secondary" onClick={signOut}>
              Sign out
            </button>
          </div>
        </section>
      </main>
    );
  }

  return user ? <ProtectedApp /> : <SignInPage />;
}
