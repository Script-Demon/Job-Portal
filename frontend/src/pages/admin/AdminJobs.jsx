import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/api.js';
import { errorMessage } from '../../api/client.js';
import { useToast } from '../../components/Toast.jsx';
import { ConfirmModal, EmptyState, ErrorBox, Field, Modal, Pagination, Spinner } from '../../components/Common.jsx';
import usePagedList from '../../hooks/usePagedList.js';
import { formatDate, JOB_TYPES } from '../../utils/format.js';

const REASONS = ['Spam or scam', 'Misleading information', 'Discriminatory content', 'Duplicate listing', 'Inappropriate content'];

export default function AdminJobs() {
  const notify = useToast();
  const { data, setData, error, filters, page, setFilters, reload } = usePagedList(adminApi.jobs, ['q', 'status']);
  const [q, setQ] = useState(filters.q);
  const [removing, setRemoving] = useState(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const replace = (j) => setData((d) => ({ ...d, content: d.content.map((x) => (x.id === j.id ? j : x)) }));

  const setStatus = async (job, status, why) => {
    setBusy(true);
    try {
      replace(await adminApi.setJobStatus(job.id, status, why));
      notify(status === 'REMOVED' ? 'Listing removed' : 'Listing restored');
    } catch (err) {
      notify(await errorMessage(err), 'error');
    } finally {
      setBusy(false);
      setRemoving(null);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.deleteJob(deleting.id);
      notify('Job permanently deleted');
      reload();
    } catch (err) {
      notify(await errorMessage(err), 'error');
    } finally {
      setBusy(false);
      setDeleting(null);
    }
  };

  return (
    <div className="container section">
      <h1>Job postings</h1>
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({ q });
        }}
      >
        <input placeholder="Search title, description or company" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search jobs" />
        <select value={filters.status} onChange={(e) => setFilters({ status: e.target.value })} aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="CLOSED">Closed</option>
          <option value="REMOVED">Removed</option>
        </select>
        <button className="btn btn-primary">Search</button>
      </form>

      <ErrorBox message={error} />
      {!data ? (
        !error && <Spinner />
      ) : data.content.length === 0 ? (
        <EmptyState title="No jobs found" />
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Job</th>
                <th>Company</th>
                <th>Applicants</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.content.map((j) => (
                <tr key={j.id}>
                  <td>
                    <Link to={`/jobs/${j.id}`} className="strong">{j.title}</Link>
                    <div className="muted small">
                      {j.location} · {JOB_TYPES[j.jobType]} · {formatDate(j.createdAt)}
                    </div>
                    {j.removalReason && <div className="text-danger small">Reason: {j.removalReason}</div>}
                  </td>
                  <td>{j.company.name}</td>
                  <td>{j.applicationCount}</td>
                  <td><span className={`badge job-${j.status.toLowerCase()}`}>{j.status.toLowerCase()}</span></td>
                  <td className="row-actions">
                    {j.status === 'REMOVED' ? (
                      <button className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setStatus(j, 'ACTIVE')}>Restore</button>
                    ) : (
                      <button className="btn btn-ghost btn-sm text-danger" onClick={() => setRemoving(j)}>Remove</button>
                    )}
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => setDeleting(j)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={page} totalPages={data.totalPages} onChange={(p) => setFilters({ page: String(p) })} />}

      {removing && (
        <Modal
          title="Remove listing"
          onClose={() => setRemoving(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setRemoving(null)}>Cancel</button>
              <button className="btn btn-danger" disabled={busy || !reason.trim()} onClick={() => setStatus(removing, 'REMOVED', reason)}>
                {busy ? 'Removing…' : 'Remove listing'}
              </button>
            </>
          }
        >
          <p>
            “{removing.title}” will be hidden from job seekers. The employer will see the reason and can’t republish it.
          </p>
          <Field label="Reason" htmlFor="reason">
            <input id="reason" list="reasons" value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} />
            <datalist id="reasons">
              {REASONS.map((r) => <option key={r} value={r} />)}
            </datalist>
          </Field>
        </Modal>
      )}

      {deleting && (
        <ConfirmModal
          title="Delete job permanently?"
          message={`"${deleting.title}" and its ${deleting.applicationCount} application(s) will be permanently deleted. To just hide it, use Remove instead.`}
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
