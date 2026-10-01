import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employerApi } from '../../api/api.js';
import { errorMessage } from '../../api/client.js';
import { useToast } from '../../components/Toast.jsx';
import { ConfirmModal, EmptyState, ErrorBox, Spinner } from '../../components/Common.jsx';
import { formatDate, formatSalary, JOB_TYPES } from '../../utils/format.js';

export default function EmployerDashboard() {
  const notify = useToast();
  const [jobs, setJobs] = useState(null);
  const [hasCompany, setHasCompany] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([employerApi.jobs(), employerApi.company().then(() => true).catch(() => false)])
      .then(([j, c]) => {
        setJobs(j);
        setHasCompany(c);
      })
      .catch(async (err) => setError(await errorMessage(err)));
  }, []);

  const toggleStatus = async (job) => {
    const status = job.status === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      const updated = await employerApi.updateJob(job.id, { ...job, status });
      setJobs((list) => list.map((j) => (j.id === job.id ? updated : j)));
      notify(status === 'ACTIVE' ? 'Job reopened' : 'Job closed to new applicants');
    } catch (err) {
      notify(await errorMessage(err), 'error');
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await employerApi.deleteJob(deleting.id);
      setJobs((list) => list.filter((j) => j.id !== deleting.id));
      notify('Job deleted');
    } catch (err) {
      notify(await errorMessage(err), 'error');
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  if (error) return <div className="container section"><ErrorBox message={error} /></div>;
  if (!jobs) return <Spinner />;

  const totalApps = jobs.reduce((n, j) => n + (j.applicationCount || 0), 0);
  const activeCount = jobs.filter((j) => j.status === 'ACTIVE').length;

  return (
    <div className="container section">
      <div className="page-head">
        <h1>My job postings</h1>
        {hasCompany && <Link to="/employer/jobs/new" className="btn btn-primary">+ Post a job</Link>}
      </div>

      {!hasCompany && (
        <div className="alert alert-info">
          Set up your company profile before posting jobs. <Link to="/employer/company">Create company profile →</Link>
        </div>
      )}

      <div className="stat-row">
        <div className="stat card"><span className="stat-value">{jobs.length}</span><span className="stat-label">Total postings</span></div>
        <div className="stat card"><span className="stat-value">{activeCount}</span><span className="stat-label">Active</span></div>
        <div className="stat card"><span className="stat-value">{totalApps}</span><span className="stat-label">Applications</span></div>
      </div>

      {jobs.length === 0 ? (
        hasCompany && (
          <EmptyState title="No jobs posted yet" action={<Link to="/employer/jobs/new" className="btn btn-primary">Post your first job</Link>} />
        )
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Status</th>
                <th>Applicants</th>
                <th>Posted</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    <Link to={`/jobs/${j.id}`} className="strong">{j.title}</Link>
                    <div className="muted small">
                      {j.location} · {JOB_TYPES[j.jobType]} · {formatSalary(j.salaryMin, j.salaryMax)}
                    </div>
                    {j.status === 'REMOVED' && <div className="text-danger small">Removed by admin: {j.removalReason}</div>}
                  </td>
                  <td><span className={`badge job-${j.status.toLowerCase()}`}>{j.status.toLowerCase()}</span></td>
                  <td>
                    <Link to={`/employer/jobs/${j.id}/applicants`} className="btn btn-ghost btn-sm">
                      {j.applicationCount} {j.applicationCount === 1 ? 'applicant' : 'applicants'}
                    </Link>
                  </td>
                  <td className="nowrap">{formatDate(j.createdAt)}</td>
                  <td className="row-actions">
                    {j.status !== 'REMOVED' && (
                      <>
                        <Link to={`/employer/jobs/${j.id}/edit`} className="btn btn-ghost btn-sm">Edit</Link>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleStatus(j)}>
                          {j.status === 'ACTIVE' ? 'Close' : 'Reopen'}
                        </button>
                      </>
                    )}
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => setDeleting(j)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete job?"
          message={`"${deleting.title}" and all ${deleting.applicationCount} application(s) will be permanently deleted.`}
          confirmLabel="Delete"
          danger
          busy={busy}
          onConfirm={remove}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}
