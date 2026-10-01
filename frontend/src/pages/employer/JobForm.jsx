import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { employerApi } from '../../api/api.js';
import { errorMessage, fieldErrors } from '../../api/client.js';
import { useToast } from '../../components/Toast.jsx';
import { ErrorBox, Field, Spinner } from '../../components/Common.jsx';
import { JOB_TYPES, LEVELS } from '../../utils/format.js';

const EMPTY = {
  title: '',
  description: '',
  location: '',
  remote: false,
  jobType: 'FULL_TIME',
  experienceLevel: '',
  salaryMin: '',
  salaryMax: '',
  skills: [],
  status: 'ACTIVE',
};

export default function JobForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const notify = useToast();
  const [form, setForm] = useState(editing ? null : EMPTY);
  const [skillInput, setSkillInput] = useState('');
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editing) return;
    employerApi
      .job(id)
      .then((j) =>
        setForm({
          ...EMPTY,
          ...j,
          experienceLevel: j.experienceLevel || '',
          salaryMin: j.salaryMin ?? '',
          salaryMax: j.salaryMax ?? '',
        }),
      )
      .catch(async (err) => setError(await errorMessage(err, 'Job not found')));
  }, [id, editing]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const addSkill = () => {
    const parts = skillInput.split(',').map((s) => s.trim()).filter(Boolean);
    const existing = new Set(form.skills.map((s) => s.toLowerCase()));
    const next = [...form.skills];
    parts.forEach((p) => {
      if (!existing.has(p.toLowerCase())) {
        existing.add(p.toLowerCase());
        next.push(p);
      }
    });
    setForm({ ...form, skills: next });
    setSkillInput('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setError('');
    const pendingSkills = skillInput.split(',').map((s) => s.trim()).filter(Boolean);
    const body = {
      title: form.title,
      description: form.description,
      location: form.location,
      remote: form.remote,
      jobType: form.jobType,
      experienceLevel: form.experienceLevel || null,
      salaryMin: form.salaryMin === '' ? null : Number(form.salaryMin),
      salaryMax: form.salaryMax === '' ? null : Number(form.salaryMax),
      skills: [...form.skills, ...pendingSkills],
      status: form.status,
    };
    try {
      const saved = editing ? await employerApi.updateJob(id, body) : await employerApi.createJob(body);
      notify(editing ? 'Job updated' : 'Job posted');
      navigate(editing ? '/employer' : `/jobs/${saved.id}`);
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(await errorMessage(err));
      setSaving(false);
    }
  };

  if (!form) return error ? <div className="container section"><ErrorBox message={error} /></div> : <Spinner />;

  return (
    <div className="container section narrow">
      <h1>{editing ? 'Edit job' : 'Post a new job'}</h1>
      <form className="card" onSubmit={submit}>
        <ErrorBox message={error} />
        <Field label="Job title" htmlFor="title" error={errors.title}>
          <input id="title" required maxLength={200} value={form.title} onChange={set('title')} placeholder="e.g. Senior Java Developer" />
        </Field>
        <div className="grid-2">
          <Field label="Location" htmlFor="location" error={errors.location}>
            <input id="location" required value={form.location} onChange={set('location')} placeholder="City, state or Remote" />
          </Field>
          <Field label=" ">
            <label className="check inline-check">
              <input type="checkbox" checked={form.remote} onChange={set('remote')} />
              Remote-friendly
            </label>
          </Field>
          <Field label="Job type" htmlFor="jobType" error={errors.jobType}>
            <select id="jobType" value={form.jobType} onChange={set('jobType')}>
              {Object.entries(JOB_TYPES).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Experience level" htmlFor="level">
            <select id="level" value={form.experienceLevel} onChange={set('experienceLevel')}>
              <option value="">Not specified</option>
              {Object.entries(LEVELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </Field>
          <Field label="Min salary (USD / year)" htmlFor="salaryMin" error={errors.salaryMin || errors.salaryRangeValid}>
            <input id="salaryMin" type="number" min="0" step="1000" value={form.salaryMin} onChange={set('salaryMin')} />
          </Field>
          <Field label="Max salary (USD / year)" htmlFor="salaryMax" error={errors.salaryMax}>
            <input id="salaryMax" type="number" min="0" step="1000" value={form.salaryMax} onChange={set('salaryMax')} />
          </Field>
        </div>

        <Field label="Skills" htmlFor="skill" error={errors.skills} hint="Press Enter or comma to add">
          <div className="skill-input">
            {form.skills.map((s) => (
              <span key={s} className="chip">
                {s}
                <button
                  type="button"
                  aria-label={`Remove ${s}`}
                  onClick={() => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              id="skill"
              value={skillInput}
              placeholder={form.skills.length ? '' : 'e.g. Java'}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addSkill();
                } else if (e.key === 'Backspace' && !skillInput && form.skills.length) {
                  setForm({ ...form, skills: form.skills.slice(0, -1) });
                }
              }}
              onBlur={() => skillInput && addSkill()}
            />
          </div>
        </Field>

        <Field label="Description" htmlFor="description" error={errors.description}>
          <textarea
            id="description"
            required
            rows={12}
            value={form.description}
            onChange={set('description')}
            placeholder="Responsibilities, requirements, benefits…"
          />
        </Field>

        {editing && form.status !== 'REMOVED' && (
          <Field label="Status" htmlFor="status">
            <select id="status" value={form.status} onChange={set('status')}>
              <option value="ACTIVE">Active — accepting applications</option>
              <option value="CLOSED">Closed — hidden from search</option>
            </select>
          </Field>
        )}

        <div className="form-actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Save changes' : 'Publish job'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
