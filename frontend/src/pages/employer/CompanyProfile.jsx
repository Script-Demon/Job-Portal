import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employerApi } from '../../api/api.js';
import { errorMessage, fieldErrors } from '../../api/client.js';
import { useToast } from '../../components/Toast.jsx';
import { CompanyLogo, ErrorBox, Field, Spinner } from '../../components/Common.jsx';

const EMPTY = { name: '', description: '', website: '', location: '', industry: '', companySize: '', logoUrl: '' };
const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export default function CompanyProfile() {
  const notify = useToast();
  const [form, setForm] = useState(null);
  const [companyId, setCompanyId] = useState(null);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    employerApi
      .company()
      .then((c) => {
        setCompanyId(c.id);
        setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, c[k] ?? ''])));
      })
      .catch((err) => {
        if (err.response?.status === 404) setForm(EMPTY);
        else errorMessage(err).then(setError);
      });
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setError('');
    try {
      const c = await employerApi.saveCompany(form);
      const created = !companyId;
      setCompanyId(c.id);
      notify(created ? 'Company profile created — you can now post jobs' : 'Company profile saved');
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(await errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!form) return error ? <div className="container section"><ErrorBox message={error} /></div> : <Spinner />;

  return (
    <div className="container section narrow">
      <div className="page-head">
        <h1>Company profile</h1>
        {companyId && <Link to={`/companies/${companyId}`} className="btn btn-ghost btn-sm">View public page</Link>}
      </div>
      <form className="card" onSubmit={save}>
        <div className="company-preview">
          <CompanyLogo name={form.name || '?'} url={form.logoUrl} size={64} />
          <div>
            <strong>{form.name || 'Your company'}</strong>
            <div className="muted small">{[form.industry, form.location].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
        <ErrorBox message={error} />
        <Field label="Company name" htmlFor="name" error={errors.name}>
          <input id="name" required value={form.name} onChange={set('name')} />
        </Field>
        <div className="grid-2">
          <Field label="Industry" htmlFor="industry" error={errors.industry}>
            <input id="industry" value={form.industry} onChange={set('industry')} placeholder="e.g. Software" />
          </Field>
          <Field label="Headquarters" htmlFor="location" error={errors.location}>
            <input id="location" value={form.location} onChange={set('location')} />
          </Field>
          <Field label="Company size" htmlFor="size" error={errors.companySize}>
            <select id="size" value={form.companySize} onChange={set('companySize')}>
              <option value="">Select…</option>
              {SIZES.map((s) => (
                <option key={s} value={s}>{s} employees</option>
              ))}
            </select>
          </Field>
          <Field label="Website" htmlFor="website" error={errors.website}>
            <input id="website" type="url" placeholder="https://" value={form.website} onChange={set('website')} />
          </Field>
        </div>
        <Field label="Logo URL" htmlFor="logo" error={errors.logoUrl} hint="Link to a square image (optional)">
          <input id="logo" type="url" placeholder="https://" value={form.logoUrl} onChange={set('logoUrl')} />
        </Field>
        <Field label="About the company" htmlFor="description" error={errors.description}>
          <textarea id="description" rows={6} value={form.description} onChange={set('description')} />
        </Field>
        <div className="form-actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : companyId ? 'Save changes' : 'Create company'}
          </button>
          {companyId && <Link to="/employer/jobs/new" className="btn btn-ghost">Post a job →</Link>}
        </div>
      </form>
    </div>
  );
}
