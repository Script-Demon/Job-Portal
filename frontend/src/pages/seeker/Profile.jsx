import { useEffect, useRef, useState } from 'react';
import { seekerApi } from '../../api/api.js';
import { errorMessage, fieldErrors } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/Toast.jsx';
import { ConfirmModal, ErrorBox, Field, Spinner } from '../../components/Common.jsx';
import { formatDate, saveBlobResponse } from '../../utils/format.js';

const EMPTY = {
  fullName: '',
  headline: '',
  phone: '',
  location: '',
  summary: '',
  skills: '',
  experienceYears: '',
  education: '',
  linkedinUrl: '',
};

export default function Profile() {
  const { user, setUser } = useAuth();
  const notify = useToast();
  const fileRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = (p) => {
    setProfile(p);
    setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, p[k] ?? ''])));
  };

  useEffect(() => {
    seekerApi.profile().then(load).catch(async (err) => setError(await errorMessage(err)));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setError('');
    try {
      const body = { ...form, experienceYears: form.experienceYears === '' ? null : Number(form.experienceYears) };
      const p = await seekerApi.updateProfile(body);
      load(p);
      setUser({ ...user, fullName: p.fullName });
      notify('Profile saved');
    } catch (err) {
      setErrors(fieldErrors(err));
      setError(await errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      notify('File is too large (max 5 MB)', 'error');
      return;
    }
    setUploading(true);
    try {
      setProfile(await seekerApi.uploadResume(file));
      notify('Resume uploaded');
    } catch (err) {
      notify(await errorMessage(err, 'Upload failed'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const download = async () => {
    try {
      saveBlobResponse(await seekerApi.downloadResume(), profile.resumeOriginalName);
    } catch (err) {
      notify(await errorMessage(err), 'error');
    }
  };

  const removeResume = async () => {
    try {
      setProfile(await seekerApi.deleteResume());
      notify('Resume removed');
    } catch (err) {
      notify(await errorMessage(err), 'error');
    } finally {
      setConfirmDelete(false);
    }
  };

  if (!profile) return error ? <div className="container section"><ErrorBox message={error} /></div> : <Spinner />;

  return (
    <div className="container section narrow">
      <h1>My profile</h1>

      <section className="card">
        <h2>Resume</h2>
        {profile.hasResume ? (
          <div className="resume-row">
            <div>
              <div className="resume-pill">📄 {profile.resumeOriginalName}</div>
              <small className="muted">Uploaded {formatDate(profile.resumeUploadedAt)}</small>
            </div>
            <div className="row-actions">
              <button className="btn btn-ghost btn-sm" onClick={download}>Download</button>
              <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Replace'}
              </button>
              <button className="btn btn-ghost btn-sm text-danger" onClick={() => setConfirmDelete(true)}>
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="upload-zone">
            <p>Upload your resume to start applying. PDF, DOC or DOCX, up to 5 MB.</p>
            <button className="btn btn-primary" onClick={() => fileRef.current.click()} disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload resume'}
            </button>
          </div>
        )}
        <input ref={fileRef} type="file" hidden accept=".pdf,.doc,.docx" onChange={upload} />
      </section>

      <form className="card" onSubmit={save}>
        <h2>Details</h2>
        <ErrorBox message={error} />
        <div className="grid-2">
          <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
            <input id="fullName" required value={form.fullName} onChange={set('fullName')} />
          </Field>
          <Field label="Email">
            <input value={profile.email} disabled />
          </Field>
          <Field label="Headline" htmlFor="headline" error={errors.headline} hint="e.g. Senior Java Developer">
            <input id="headline" value={form.headline} onChange={set('headline')} />
          </Field>
          <Field label="Location" htmlFor="location" error={errors.location}>
            <input id="location" value={form.location} onChange={set('location')} />
          </Field>
          <Field label="Phone" htmlFor="phone" error={errors.phone}>
            <input id="phone" value={form.phone} onChange={set('phone')} />
          </Field>
          <Field label="Years of experience" htmlFor="exp" error={errors.experienceYears}>
            <input id="exp" type="number" min="0" max="60" value={form.experienceYears} onChange={set('experienceYears')} />
          </Field>
        </div>
        <Field label="Skills" htmlFor="skills" error={errors.skills} hint="Comma-separated, e.g. Java, React, SQL">
          <input id="skills" value={form.skills} onChange={set('skills')} />
        </Field>
        <Field label="LinkedIn URL" htmlFor="linkedin" error={errors.linkedinUrl}>
          <input id="linkedin" type="url" placeholder="https://linkedin.com/in/…" value={form.linkedinUrl} onChange={set('linkedinUrl')} />
        </Field>
        <Field label="Summary" htmlFor="summary" error={errors.summary}>
          <textarea id="summary" rows={5} value={form.summary} onChange={set('summary')} />
        </Field>
        <Field label="Education" htmlFor="education" error={errors.education}>
          <textarea id="education" rows={3} value={form.education} onChange={set('education')} />
        </Field>
        <div className="form-actions">
          <button className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>

      {confirmDelete && (
        <ConfirmModal
          title="Remove resume?"
          message="You won't be able to apply to new jobs until you upload another one. Applications you've already submitted keep their resume."
          confirmLabel="Remove"
          danger
          onConfirm={removeResume}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
