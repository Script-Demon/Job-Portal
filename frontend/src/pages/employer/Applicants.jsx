import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { employerApi } from '../../api/api.js';
import { errorMessage } from '../../api/client.js';
import { useToast } from '../../components/Toast.jsx';
import { EmptyState, ErrorBox, Modal, Spinner, StatusBadge } from '../../components/Common.jsx';
import { APPLICATION_STATUSES, formatDate, initials, saveBlobResponse } from '../../utils/format.js';

const SETTABLE = Object.keys(APPLICATION_STATUSES).filter((s) => s !== 'WITHDRAWN');

export default function Applicants() {
  const { id } = useParams();
  const notify = useToast();
  const [job, setJob] = useState(null);
  const [apps, setApps] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [viewing, setViewing] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    Promise.all([employerApi.job(id), employerApi.applicants(id)])
      .then(([j, a]) => {
        setJob(j);
        setApps(a);
      })
      .catch(async (err) => setError(await errorMessage(err)));
  }, [id]);

  const changeStatus = async (app, status) => {
    setUpdatingId(app.id);
    try {
      const updated = await employerApi.setStatus(app.id, status);
      setApps((list) => list.map((a) => (a.id === app.id ? updated : a)));
      if (viewing?.id === app.id) setViewing(updated);
      notify(`Moved ${app.applicant.fullName} to ${APPLICATION_STATUSES[status]}`);
    } catch (err) {
      notify(await errorMessage(err), 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const download = async (app) => {
    try {
      saveBlobResponse(await employerApi.downloadResume(app.id), app.resumeOriginalName);
    } catch (err) {
      notify(await errorMessage(err, 'Download failed'), 'error');
    }
  };

  if (error) return <div className="container section"><ErrorBox message={error} /></div>;
  if (!apps) return <Spinner />;

  const counts = apps.reduce((m, a) => ({ ...m, [a.status]: (m[a.status] || 0) + 1 }), {});
  const shown = filter === 'ALL' ? apps : apps.filter((a) => a.status === filter);

  return (
    <div className="container section">
      <Link to="/employer" className="back-link">← Back to my jobs</Link>
      <div className="page-head">
        <div>
          <h1>Applicants</h1>
          <p className="muted">
            <Link to={`/jobs/${job.id}`}>{job.title}</Link> · {apps.length} total
          </p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>
          All ({apps.length})
        </button>
        {Object.entries(APPLICATION_STATUSES)
          .filter(([s]) => counts[s])
          .map(([s, label]) => (
            <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {label} ({counts[s]})
            </button>
          ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState title={apps.length ? 'No applicants with this status' : 'No applications yet'}>
          {!apps.length && 'Applications will appear here as candidates apply.'}
        </EmptyState>
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Applied</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shown.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="person">
                      <span className="avatar">{initials(a.applicant.fullName)}</span>
                      <div>
                        <button className="link-btn strong" onClick={() => setViewing(a)}>{a.applicant.fullName}</button>
                        <div className="muted small">
                          {[a.applicant.headline, a.applicant.location].filter(Boolean).join(' · ') || a.applicant.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="nowrap">{formatDate(a.appliedAt)}</td>
                  <td>
                    {a.status === 'WITHDRAWN' ? (
                      <StatusBadge status="WITHDRAWN" />
                    ) : (
                      <select
                        className={`status-select status-${a.status.toLowerCase()}`}
                        value={a.status}
                        disabled={updatingId === a.id}
                        aria-label={`Status for ${a.applicant.fullName}`}
                        onChange={(e) => changeStatus(a, e.target.value)}
                      >
                        {SETTABLE.map((s) => (
                          <option key={s} value={s}>{APPLICATION_STATUSES[s]}</option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="row-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => setViewing(a)}>View</button>
                    {a.hasResume && (
                      <button className="btn btn-ghost btn-sm" onClick={() => download(a)}>Resume ↓</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <Modal
          title={viewing.applicant.fullName}
          onClose={() => setViewing(null)}
          footer={
            viewing.hasResume && (
              <button className="btn btn-primary" onClick={() => download(viewing)}>Download resume</button>
            )
          }
        >
          <div className="applicant-detail">
            {viewing.applicant.headline && <p className="strong">{viewing.applicant.headline}</p>}
            <dl>
              <dt>Email</dt>
              <dd><a href={`mailto:${viewing.applicant.email}`}>{viewing.applicant.email}</a></dd>
              {viewing.applicant.phone && (<><dt>Phone</dt><dd>{viewing.applicant.phone}</dd></>)}
              {viewing.applicant.location && (<><dt>Location</dt><dd>{viewing.applicant.location}</dd></>)}
              {viewing.applicant.experienceYears != null && (
                <><dt>Experience</dt><dd>{viewing.applicant.experienceYears} years</dd></>
              )}
              {viewing.applicant.linkedinUrl && (
                <>
                  <dt>LinkedIn</dt>
                  <dd><a href={viewing.applicant.linkedinUrl} target="_blank" rel="noreferrer noopener">Profile ↗</a></dd>
                </>
              )}
              <dt>Status</dt>
              <dd><StatusBadge status={viewing.status} /></dd>
            </dl>
            {viewing.applicant.skills && (
              <div className="skills">
                {viewing.applicant.skills.split(',').map((s) => (
                  <span key={s} className="chip">{s.trim()}</span>
                ))}
              </div>
            )}
            {viewing.applicant.summary && (<><h4>Summary</h4><p className="prose">{viewing.applicant.summary}</p></>)}
            <h4>Cover letter</h4>
            <p className="prose">{viewing.coverLetter || <span className="muted">No cover letter provided.</span>}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
