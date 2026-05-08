import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ChartCard from '../components/ChartCard';
import { User, Bell, Shield, Palette, Globe, Key, Save, Eye, EyeOff } from 'lucide-react';

const Input = ({ style, ...p }) => <input style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box', ...style }} {...p} />;
const Toggle = ({ checked, onChange }) => (
  <div onClick={() => onChange(!checked)} style={{ width: 44, height: 24, borderRadius: 12, background: checked ? '#f97316' : 'rgba(255,255,255,0.2)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
    <div style={{ position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
  </div>
);
const Field = ({ label, children }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}>{label}</label>
    {children}
  </div>
);

export default function SettingsPage({ role = 'editor' }) {
  const [profile, setProfile] = useState({ name: 'Sarah Editor', email: 'editor@dalidata.com', bio: 'Content editor at DaliData platform.', phone: '+1 234 567 8900' });
  const [notifications, setNotifications] = useState({ email: true, push: true, reviews: true, approvals: true, reports: false, marketing: false });
  const [security, setSecurity] = useState({ twoFactor: false, sessionTimeout: '30', loginAlerts: true });
  const [showPw, setShowPw] = useState(false);
  const [passwords, setPasswords] = useState({ current: '', newPw: '', confirm: '' });
  const [activeTab, setActiveTab] = useState('profile');
  const [toast, setToast] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'password', label: 'Password', icon: <Key size={16} /> },
  ];

  return (
    <DashboardLayout role={role}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>Settings</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: '4px 0 0', fontSize: 14 }}>Manage your account preferences</p>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 10, padding: 4, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, background: activeTab === t.id ? 'rgba(255,255,255,0.2)' : 'transparent', color: activeTab === t.id ? '#fff' : 'rgba(255,255,255,0.6)', transition: 'all 0.2s' }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ChartCard title="Profile Information">
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#fff' }}>
                  {profile.name.split(' ').map(n => n[0]).join('')}
                </div>
                <button style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, color: '#fff', fontSize: 12, cursor: 'pointer' }}>Change Photo</button>
              </div>
              {/* Fields */}
              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16 }}>
                  <Field label="Full Name"><Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} /></Field>
                  <Field label="Email Address"><Input type="email" value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></Field>
                  <Field label="Phone Number"><Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></Field>
                </div>
                <Field label="Bio">
                  <textarea value={profile.bio} onChange={e => setProfile({ ...profile, bio: e.target.value })} rows={3}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 14, outline: 'none', width: '100%', resize: 'vertical', boxSizing: 'border-box' }} />
                </Field>
                <button onClick={() => showToast('Profile saved successfully')} style={{ padding: '10px 24px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          </ChartCard>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <ChartCard title="Notification Preferences">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
                { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
                { key: 'reviews', label: 'Review Alerts', desc: 'Notify when datasets need review' },
                { key: 'approvals', label: 'Approval Updates', desc: 'Updates on dataset approvals' },
                { key: 'reports', label: 'Weekly Reports', desc: 'Receive weekly analytics reports' },
                { key: 'marketing', label: 'Marketing Emails', desc: 'Platform updates and announcements' },
              ].map((item, i) => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 500, margin: 0, fontSize: 14 }}>{item.label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '2px 0 0', fontSize: 12 }}>{item.desc}</p>
                  </div>
                  <Toggle checked={notifications[item.key]} onChange={v => setNotifications({ ...notifications, [item.key]: v })} />
                </div>
              ))}
            </div>
            <button onClick={() => showToast('Notification preferences saved')} style={{ marginTop: 20, padding: '10px 24px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Save size={16} /> Save Preferences
            </button>
          </ChartCard>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <ChartCard title="Security Settings">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { key: 'twoFactor', label: 'Two-Factor Authentication', desc: 'Add an extra layer of security to your account' },
                { key: 'loginAlerts', label: 'Login Alerts', desc: 'Get notified of new sign-ins to your account' },
              ].map((item, i) => (
                <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 500, margin: 0, fontSize: 14 }}>{item.label}</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', margin: '2px 0 0', fontSize: 12 }}>{item.desc}</p>
                  </div>
                  <Toggle checked={security[item.key]} onChange={v => setSecurity({ ...security, [item.key]: v })} />
                </div>
              ))}
              <div style={{ padding: '16px 0' }}>
                <p style={{ color: '#fff', fontWeight: 500, margin: '0 0 8px', fontSize: 14 }}>Session Timeout</p>
                <select value={security.sessionTimeout} onChange={e => setSecurity({ ...security, sessionTimeout: e.target.value })}
                  style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 12px', color: '#fff', fontSize: 14, outline: 'none', cursor: 'pointer' }}>
                  {['15', '30', '60', '120'].map(v => <option key={v} value={v}>{v} minutes</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => showToast('Security settings saved')} style={{ marginTop: 8, padding: '10px 24px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Save size={16} /> Save Settings
            </button>
          </ChartCard>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <ChartCard title="Change Password">
            <div style={{ maxWidth: 400 }}>
              <Field label="Current Password">
                <div style={{ position: 'relative' }}>
                  <Input type={showPw ? 'text' : 'password'} value={passwords.current} onChange={e => setPasswords({ ...passwords, current: e.target.value })} placeholder="Enter current password" style={{ paddingRight: 44 }} />
                  <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer' }}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </Field>
              <Field label="New Password"><Input type="password" value={passwords.newPw} onChange={e => setPasswords({ ...passwords, newPw: e.target.value })} placeholder="Enter new password" /></Field>
              <Field label="Confirm New Password"><Input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="Confirm new password" /></Field>
              {passwords.newPw && passwords.confirm && passwords.newPw !== passwords.confirm && (
                <p style={{ color: '#f87171', fontSize: 13, margin: '-8px 0 12px' }}>Passwords do not match</p>
              )}
              <button onClick={() => { if (passwords.newPw === passwords.confirm && passwords.current) { showToast('Password changed successfully'); setPasswords({ current: '', newPw: '', confirm: '' }); } else showToast('Please fill all fields correctly'); }}
                style={{ padding: '10px 24px', background: '#f97316', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Key size={16} /> Update Password
              </button>
            </div>
          </ChartCard>
        )}
      </div>

      {toast && <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#1e293b', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '12px 20px', color: '#fff', fontSize: 14, zIndex: 300 }}>{toast}</div>}
    </DashboardLayout>
  );
}
