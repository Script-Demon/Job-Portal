import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { homeFor, useAuth } from '../context/AuthContext.jsx';
import { errorMessage, fieldErrors } from '../api/client.js';
import { ErrorBox, Field } from '../components/Common.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: params.get('role') === 'EMPLOYER' ? 'EMPLOYER' : 'JOB_SEEKER',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    try {
      const body = { ...form, companyName: form.role === 'EMPLOYER' ? form.companyName : null };
      const user = await register(body);
      navigate(user.role === 'EMPLOYER' ? '/employer/company' : user.role === 'JOB_SEEKER' ? '/seeker/profile' : homeFor(user.role));
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(await errorMessage(err, 'Registration failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={submit}>
        <h1>Create your account</h1>
        <div className="role-switch" role="radiogroup" aria-label="Account type">
          {[
            ['JOB_SEEKER', "I'm looking for a job", '🔎'],
            ['EMPLOYER', "I'm hiring", '🏢'],
          ].map(([value, label, icon]) => (
            <button
              type="button"
              key={value}
              role="radio"
              aria-checked={form.role === value}
              className={`role-option ${form.role === value ? 'active' : ''}`}
              onClick={() => setForm({ ...form, role: value })}
            >
              <span className="role-icon">{icon}</span>
              {label}
            </button>
          ))}
        </div>
        <ErrorBox message={error} />
        <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
          <input id="fullName" required value={form.fullName} onChange={set('fullName')} autoComplete="name" />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email}>
          <input id="email" type="email" required value={form.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters">
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
          />
        </Field>
        {form.role === 'EMPLOYER' && (
          <Field label="Company name" htmlFor="companyName" hint="You can complete the company profile next">
            <input id="companyName" value={form.companyName} onChange={set('companyName')} />
          </Field>
        )}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
        <p className="center muted">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
