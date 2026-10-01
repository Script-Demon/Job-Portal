import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext.jsx';
import { errorMessage } from '../api/client.js';
import { ErrorBox, Field } from '../components/Common.jsx';

const DEMO = [
  { label: 'Job seeker', email: 'seeker@demo.com', password: 'Password@123' },
  { label: 'Employer', email: 'employer@demo.com', password: 'Password@123' },
  { label: 'Admin', email: 'admin@jobportal.com', password: 'Admin@123' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(form);
      navigate(location.state?.from || homeFor(user.role), { replace: true });
    } catch (err) {
      setError(await errorMessage(err, 'Login failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <p className="muted">Log in to continue to JobPortal.</p>
        <ErrorBox message={error} />
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password" htmlFor="password">
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Logging in…' : 'Log in'}
        </button>
        <p className="center muted">
          New here? <Link to="/register">Create an account</Link>
        </p>
        <div className="demo-box">
          <strong>Demo accounts</strong>
          <div className="demo-buttons">
            {DEMO.map((d) => (
              <button
                type="button"
                key={d.email}
                className="btn btn-ghost btn-sm"
                onClick={() => setForm({ email: d.email, password: d.password })}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
