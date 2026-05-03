import { ReactNode, useState } from 'react';
import { Icons } from '../components/Icons';
import { useAuth } from '../lib/auth';
import { useToast } from '../components/Toast';
import { ApiError } from '../lib/api';

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="auth">
      <div className="auth__brand">
        <div className="auth__logo">
          <span className="auth__logo-mark">T</span>
          <span>TaskFlow</span>
        </div>
        <div className="auth__hero">
          <h1>Where teams ship work, together.</h1>
          <p>Plan projects, track tasks across your kanban, and keep everyone aligned — in one quiet, fast workspace.</p>
          <div className="auth__features">
            <div className="auth__feature"><span className="auth__feature-check"><Icons.Check size={12} /></span> Role-based access for admins & members</div>
            <div className="auth__feature"><span className="auth__feature-check"><Icons.Check size={12} /></span> Drag-and-drop kanban with priorities</div>
            <div className="auth__feature"><span className="auth__feature-check"><Icons.Check size={12} /></span> Real-time activity, comments & mentions</div>
          </div>
        </div>
        <div style={{ position: 'relative', fontSize: 12, opacity: 0.8 }}>© 2026 TaskFlow Labs · Crafted in San Francisco</div>
        <div className="auth__decor" />
      </div>
      <div className="auth__panel">{children}</div>
    </div>
  );
}

type Mode = 'login' | 'signup';

export function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  return mode === 'login'
    ? <LoginScreen onSwitch={() => setMode('signup')} />
    : <SignupScreen onSwitch={() => setMode('login')} />;
}

function LoginScreen({ onSwitch }: { onSwitch: () => void }) {
  const { login } = useAuth();
  const toast = useToast();
  const [showPw, setShowPw] = useState(false);
  const [role, setRole] = useState<'admin' | 'member'>('admin');
  const [email, setEmail] = useState('maya@taskflow.app');
  const [password, setPassword] = useState('Password123!');
  const [submitting, setSubmitting] = useState(false);

  const onRoleChange = (r: 'admin' | 'member') => {
    setRole(r);
    setEmail(r === 'admin' ? 'maya@taskflow.app' : 'devon@taskflow.app');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const u = await login(email, password);
      toast.push({ type: 'success', title: 'Welcome back!', desc: `Signed in as ${u.name}.` });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Login failed';
      toast.push({ type: 'error', title: 'Sign in failed', desc: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <h2 className="auth-card__title">Welcome back</h2>
        <p className="auth-card__sub">Sign in to your TaskFlow workspace.</p>
        <form className="auth-card__form" onSubmit={submit}>
          <div className="field">
            <label className="field__label">Email</label>
            <div className="input-wrap">
              <span className="input-wrap__icon"><Icons.Mail size={16} /></span>
              <input
                className="input input--with-icon"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
          </div>
          <div className="field">
            <label className="field__label">Password</label>
            <div className="input-wrap">
              <span className="input-wrap__icon"><Icons.Lock size={16} /></span>
              <input
                className="input input--with-icon"
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="input-wrap__icon"
                style={{ left: 'auto', right: 14 }}
                onClick={() => setShowPw(!showPw)}
              >
                {showPw ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="field">
            <label className="field__label">Sign in as (demo)</label>
            <div className="role-picker">
              <button
                type="button"
                className={`role-card ${role === 'admin' ? 'role-card--active' : ''}`}
                onClick={() => onRoleChange('admin')}
              >
                <div className="role-card__icon"><Icons.Shield size={16} /></div>
                <div>
                  <div className="role-card__title">Admin</div>
                  <div className="role-card__desc">Manage projects, tasks & team</div>
                </div>
              </button>
              <button
                type="button"
                className={`role-card ${role === 'member' ? 'role-card--active' : ''}`}
                onClick={() => onRoleChange('member')}
              >
                <div className="role-card__icon"><Icons.User size={16} /></div>
                <div>
                  <div className="role-card__title">Member</div>
                  <div className="role-card__desc">View & update assigned work</div>
                </div>
              </button>
            </div>
          </div>
          <div className="auth-card__row">
            <label className="checkbox">
              <input type="checkbox" defaultChecked />
              <span className="checkbox__box"></span> Stay signed in
            </label>
            <a className="auth-card__link" href="#" onClick={(e) => e.preventDefault()}>Forgot password?</a>
          </div>
          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
            {submitting ? 'Signing in…' : <>Sign in <Icons.ArrowRight size={16} /></>}
          </button>
          <div className="auth-card__divider">or continue with</div>
          <div className="auth-card__social">
            <button type="button" className="btn btn--secondary"><GoogleMark /> Google</button>
            <button type="button" className="btn btn--secondary"><GithubMark /> GitHub</button>
          </div>
        </form>
        <div className="auth-card__foot">
          New to TaskFlow?{' '}
          <a className="auth-card__link" href="#" onClick={(e) => { e.preventDefault(); onSwitch(); }}>
            Create an account
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}

function SignupScreen({ onSwitch }: { onSwitch: () => void }) {
  const { signup } = useAuth();
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'member'>('admin');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.push({ type: 'warn', title: 'Password too short', desc: 'Use at least 8 characters.' });
      return;
    }
    setSubmitting(true);
    try {
      await signup({ name, email, password, role });
      toast.push({ type: 'success', title: 'Account created', desc: 'Welcome to TaskFlow 🎉' });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Signup failed';
      toast.push({ type: 'error', title: 'Signup failed', desc: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      <div className="auth-card">
        <h2 className="auth-card__title">Create your account</h2>
        <p className="auth-card__sub">Free for up to 5 members. No credit card needed.</p>
        <form className="auth-card__form" onSubmit={submit}>
          <div className="field">
            <label className="field__label">Full name</label>
            <div className="input-wrap">
              <span className="input-wrap__icon"><Icons.User size={16} /></span>
              <input
                className="input input--with-icon"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label className="field__label">Work email</label>
            <div className="input-wrap">
              <span className="input-wrap__icon"><Icons.Mail size={16} /></span>
              <input
                className="input input--with-icon"
                type="email"
                placeholder="jane@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label className="field__label">Password</label>
            <div className="input-wrap">
              <span className="input-wrap__icon"><Icons.Lock size={16} /></span>
              <input
                className="input input--with-icon"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="field__hint">Use 8+ chars with letters and numbers.</div>
          </div>
          <div className="field">
            <label className="field__label">I'm joining as</label>
            <div className="role-picker">
              <button
                type="button"
                className={`role-card ${role === 'admin' ? 'role-card--active' : ''}`}
                onClick={() => setRole('admin')}
              >
                <div className="role-card__icon"><Icons.Shield size={16} /></div>
                <div>
                  <div className="role-card__title">Admin</div>
                  <div className="role-card__desc">I'm setting up a workspace</div>
                </div>
              </button>
              <button
                type="button"
                className={`role-card ${role === 'member' ? 'role-card--active' : ''}`}
                onClick={() => setRole('member')}
              >
                <div className="role-card__icon"><Icons.User size={16} /></div>
                <div>
                  <div className="role-card__title">Member</div>
                  <div className="role-card__desc">I have an invite link</div>
                </div>
              </button>
            </div>
          </div>
          <label className="checkbox">
            <input type="checkbox" defaultChecked />
            <span className="checkbox__box"></span> I agree to the Terms and Privacy Policy
          </label>
          <button type="submit" className="btn btn--primary btn--lg btn--block" disabled={submitting}>
            {submitting ? 'Creating…' : <>Create account <Icons.ArrowRight size={16} /></>}
          </button>
        </form>
        <div className="auth-card__foot">
          Already have an account?{' '}
          <a className="auth-card__link" href="#" onClick={(e) => { e.preventDefault(); onSwitch(); }}>
            Sign in
          </a>
        </div>
      </div>
    </AuthLayout>
  );
}

const GoogleMark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.22-4.74 3.22-8.32z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.99 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.15-4.53H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC04" d="M5.85 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.43.35-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.94l3.67-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.67 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
);
const GithubMark = () => (
  <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#0f1230" d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12c0 4.6 3 8.5 7.2 9.9.5.1.7-.2.7-.5v-1.9c-2.9.6-3.5-1.4-3.5-1.4-.5-1.2-1.2-1.5-1.2-1.5-1-.6.1-.6.1-.6 1 .1 1.6 1.1 1.6 1.1.9 1.6 2.5 1.1 3.1.9.1-.7.4-1.1.7-1.4-2.3-.3-4.7-1.2-4.7-5.2 0-1.1.4-2.1 1.1-2.8-.1-.3-.5-1.4.1-2.9 0 0 .9-.3 2.9 1.1.9-.2 1.8-.4 2.6-.4.9 0 1.8.1 2.6.4 2-1.4 2.9-1.1 2.9-1.1.6 1.5.2 2.6.1 2.9.7.7 1.1 1.7 1.1 2.8 0 4-2.4 4.9-4.7 5.2.4.3.7.9.7 1.9v2.8c0 .3.2.6.7.5 4.2-1.4 7.2-5.4 7.2-9.9C22.5 6.2 17.8 1.5 12 1.5z"/></svg>
);
