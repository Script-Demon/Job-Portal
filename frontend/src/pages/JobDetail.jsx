import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { jobsApi, seekerApi } from '../api/api.js';
import { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { CompanyLogo, ErrorBox, Field, Modal, Spinner } from '../components/Common.jsx';
import useSaveToggle from '../hooks/useSaveToggle.js';
import { formatDate, formatSalary, JOB_TYPES, LEVELS, timeAgo } from '../utils/format.js';

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const notify = useToast();
  const [job, setJob] = useState(null);
  const [error, setError] = useState('');
  const [applyOpen, setApplyOpen] = useState(false);

  useEffect(() => {
    setJob(null);
    jobsApi
      .get(id)
      .then(setJob)
      .catch(async (err) => setError(await errorMessage(err, 'Job not found')));
  }, [id, user]);

  const { toggle, busyId } = useSaveToggle((_, saved) => setJob((j) => ({ ...j, saved })));

  if (error) return <div className="container section"><ErrorBox message={error} /></div>;
  if (!job) return <Spinner />;

  const isSeeker = user?.role === 'JOB_SEEKER';
  const accepting = job.status === 'ACTIVE';

  const onApplyClick = () => {
    if (!user) navigate('/login', { state: { from: `/jobs/${id}` } });
    else setApplyOpen(true);
  };

  return (
    <div className="container section">
      <Link to="/jobs" className="back-link">← Back to jobs</Link>
      <div className="detail-layout">
        <article className="card detail-main">
          {job.status === 'REMOVED' && (
            <div className="alert alert-error">Removed by an administrator: {job.removalReason}</div>
          )}
          {job.status === 'CLOSED' && <div className="alert alert-info">This job is no longer accepting applications.</div>}
          <div className="detail-head">
            <CompanyLogo name={job.company.name} url={job.company.logoUrl} size={64} />
            <div>
              <h1>{job.title}</h1>
              <div className="muted">
                <Link to={`/companies/${job.company.id}`}>{job.company.name}</Link> · {job.location}
                {job.remote && <span className="tag tag-green">Remote</span>}
              </div>
            </div>
          </div>
          <div className="job-meta">
            <span className="tag">{JOB_TYPES[job.jobType]}</span>
            {job.experienceLevel && <span className="tag">{LEVELS[job.experienceLevel]}</span>}
            <span className="salary">{formatSalary(job.salaryMin, job.salaryMax)}</span>
            <span className="muted small">Posted {timeAgo(job.createdAt)}</span>
          </div>

          {(!user || isSeeker) && (
            <div className="detail-actions">
              {job.applied ? (
                <Link to="/seeker/applications" className="btn btn-success">✓ Applied — view status</Link>
              ) : (
                <button className="btn btn-primary" disabled={!accepting} onClick={onApplyClick}>
                  {accepting ? 'Apply now' : 'Applications closed'}
                </button>
              )}
              {toggle && (
                <button className="btn btn-outline" onClick={() => toggle(job)} disabled={busyId === job.id}>
                  {job.saved ? '★ Saved' : '☆ Save'}
                </button>
              )}
            </div>
          )}

          <h2>About the role</h2>
          <div className="prose">{job.description}</div>

          {job.skills.length > 0 && (
            <>
              <h2>Skills</h2>
              <div className="skills">
                {job.skills.map((s) => (
                  <span key={s} className="chip">{s}</span>
                ))}
              </div>
            </>
          )}
        </article>

        <aside className="card detail-side">
          <h3>About {job.company.name}</h3>
          {job.company.industry && <p className="muted">{job.company.industry}</p>}
          {job.company.location && <p>📍 {job.company.location}</p>}
          {job.company.website && (
            <p>
              <a href={job.company.website} target="_blank" rel="noreferrer noopener">
                {job.company.website.replace(/^https?:\/\//, '')}
              </a>
            </p>
          )}
          <Link to={`/companies/${job.company.id}`} className="btn btn-ghost btn-block">
            View company
          </Link>
          <hr />
          <p className="muted small">Posted {formatDate(job.createdAt)}</p>
        </aside>
      </div>

      {applyOpen && (
        <ApplyModal
          job={job}
          onClose={() => setApplyOpen(false)}
          onApplied={() => {
            setJob({ ...job, applied: true });
            setApplyOpen(false);
            notify('Application submitted!');
          }}
        />
      )}
    </div>
  );
}

function ApplyModal({ job, onClose, onApplied }) {
  const [profile, setProfile] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    seekerApi.profile().then(setProfile).catch(async (err) => setError(await errorMessage(err)));
  }, []);

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await jobsApi.apply(job.id, coverLetter);
      onApplied();
    } catch (err) {
      setError(await errorMessage(err, 'Could not submit application'));
      setBusy(false);
    }
  };

  const ready = profile?.hasResume;

  return (
    <Modal
      title={`Apply to ${job.title}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={!ready || busy}>
            {busy ? 'Submitting…' : 'Submit application'}
          </button>
        </>
      }
    >
      <ErrorBox message={error} />
      {!profile ? (
        !error && <Spinner />
      ) : ready ? (
        <>
          <div className="resume-pill">📄 {profile.resumeOriginalName}</div>
          <p className="muted small">
            Your current resume will be attached. <Link to="/seeker/profile">Update it in your profile</Link>.
          </p>
          <Field label="Cover letter (optional)" htmlFor="cover">
            <textarea
              id="cover"
              rows={7}
              maxLength={5000}
              value={coverLetter}
              placeholder={`Tell ${job.company.name} why you're a great fit…`}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </Field>
        </>
      ) : (
        <div className="alert alert-info">
          You need to upload a resume before applying. <Link to="/seeker/profile">Go to your profile →</Link>
        </div>
      )}
    </Modal>
  );
}
