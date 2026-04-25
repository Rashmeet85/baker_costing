import { Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BRAND_NAME } from '../utils/constants';

export function SignInPage() {
  const { authError, signIn } = useAuth();

  return (
    <main className="app-shell" style={{ display: 'grid', alignItems: 'center' }}>
      <section className="glass-card hero-card stack" style={{ minHeight: 420 }}>
        <div className="pill" style={{ width: 'fit-content' }}>
          <Sparkles size={16} />
          Baker business companion
        </div>
        <div>
          <h1 className="page-title" style={{ fontSize: '2.8rem', lineHeight: 0.95 }}>
            {BRAND_NAME}
          </h1>
          <p className="page-subtitle" style={{ maxWidth: 320 }}>
            Price every bake, capture sales, and understand profit without spreadsheets or menu clutter.
          </p>
        </div>
        <div className="glass-card surface-card stack-sm" style={{ marginTop: 'auto' }}>
          <strong>Sign in with Google</strong>
          <span className="muted">Your session stays signed in on this device.</span>
          <button type="button" className="button" onClick={signIn}>
            Continue
          </button>
          {authError ? <span className="tiny">{authError}</span> : null}
        </div>
      </section>
    </main>
  );
}
