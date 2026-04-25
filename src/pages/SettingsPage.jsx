import { useEffect, useState } from 'react';
import { Download, LogOut, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionCard } from '../components/ui/SectionCard';
import { useAuth } from '../context/AuthContext';
import { useBakery } from '../context/BakeryContext';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { removeBakeryMember, subscribeToRoles, updateBakeryMembers } from '../services/bakeryService';
import { canCreateCoOwners, canManageTeam } from '../utils/permissions';
import { BRAND_NAME, OWNER_EMAIL } from '../utils/constants';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role, profile } = useBakery();
  const { isInstallAvailable, promptInstall } = useInstallPrompt();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    if (!canManageTeam(role)) {
      setRoles([]);
      return undefined;
    }

    return subscribeToRoles(setRoles);
  }, [role]);

  return (
    <div className="page">
      <section className="glass-card hero-card">
        <div className="hero-kicker">
          <span className="hero-emoji" aria-hidden="true">{'\u2699\uFE0F'}</span>
          <span className="tiny">Bakery settings</span>
        </div>
        <h1 className="page-title">{BRAND_NAME}</h1>
        <p className="page-subtitle">Install the app, manage your team, and keep everything tidy in one place.</p>
      </section>

      <SectionCard>
        <div className="profile-panel">
          <div>
            <strong>{user?.displayName}</strong>
            <div className="tiny">{user?.email}</div>
          </div>
          <div className="pill">{role}</div>
        </div>
        {isInstallAvailable ? (
          <button type="button" className="button" style={{ marginTop: 14 }} onClick={promptInstall}>
            <Download size={18} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
            Install app
          </button>
        ) : (
          <span className="muted">Install prompt appears here when your device allows app installation.</span>
        )}
        <button type="button" className="button secondary" style={{ marginTop: 14 }} onClick={signOut}>
          <LogOut size={18} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
          Sign out
        </button>
      </SectionCard>

      <SectionCard className="shortcut-card">
        <button type="button" className="shortcut-row" onClick={() => navigate('/ingredients')}>
          <div className="shortcut-copy">
            <span className="shortcut-emoji" aria-hidden="true">{'\uD83C\uDF6F'}</span>
            <div>
              <strong>Open ingredient library</strong>
              <div className="tiny">Keep your saved prices fresh</div>
            </div>
          </div>
          <span className="shortcut-arrow">{'\u203A'}</span>
        </button>
      </SectionCard>

      <SectionCard>
        <div className="page-header">
          <div>
            <strong>Team access</strong>
            <p className="page-subtitle">Simple access control for the bakery team.</p>
          </div>
          <div className="pill">
            <Users size={14} />
            {roles.length + 1} members
          </div>
        </div>
        <div className="stack-sm" style={{ marginTop: 14 }}>
          <div className="list-item team-row">
            <div>
              <strong>{OWNER_EMAIL === user?.email ? profile?.displayName || 'You' : OWNER_EMAIL}</strong>
              <div className="tiny">{OWNER_EMAIL}</div>
            </div>
            <div className="pill">owner</div>
          </div>
          {roles
            .filter((item) => item.id !== OWNER_EMAIL)
            .sort((a, b) => a.id.localeCompare(b.id))
            .map((member) => (
              <div key={member.id} className="list-item team-row">
                <div>
                  <strong>{member.id === user?.email ? profile?.displayName || 'You' : member.id}</strong>
                  <div className="tiny">{member.id}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div className="pill">{member.role === 'coowner' ? 'co-owner' : member.role}</div>
                  {canManageTeam(role) && (role === 'owner' || member.role === 'viewer') ? (
                    <button type="button" className="icon-button" onClick={() => removeBakeryMember(member.id)}>
                      <LogOut size={16} />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
        </div>

        {canManageTeam(role) ? (
          <div className="stack-sm" style={{ marginTop: 14 }}>
            <input
              className="field"
              placeholder="Add team member email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
            />
            <select className="field" value={inviteRole} onChange={(event) => setInviteRole(event.target.value)}>
              {canCreateCoOwners(role) ? <option value="co-owner">Co-owner</option> : null}
              <option value="viewer">Viewer</option>
            </select>
            <button
              type="button"
              className="button"
              onClick={async () => {
                if (!inviteEmail.trim()) {
                  return;
                }

                await updateBakeryMembers({
                  userEmail: inviteEmail.trim().toLowerCase(),
                  role: inviteRole
                });
                setInviteEmail('');
                setInviteRole(canCreateCoOwners(role) ? 'co-owner' : 'viewer');
              }}
            >
              Update access
            </button>
          </div>
        ) : null}
      </SectionCard>
    </div>
  );
}
