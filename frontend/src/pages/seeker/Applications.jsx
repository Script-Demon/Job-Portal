import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { seekerApi } from '../../api/api.js';
import { errorMessage } from '../../api/client.js';
import { useToast } from '../../components/Toast.jsx';
import { ConfirmModal, EmptyState, ErrorBox, Spinner, StatusBadge } from '../../components/Common.jsx';
import { formatDate, JOB_TYPES, timeAgo } from '../../utils/format.js';

const PIPELINE = ['APPLIED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED'];
const FINAL = ['HIRED', 'REJECTED', 'WITHDRAWN'];

export default function Applications() {
  const notify = useToast();
  const [apps, setApps] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [withdrawing, setWithdrawing] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    seekerApi.applications().then(setApps).catch(async (err) => setError(await errorMessage(err)));
  }, []);

  const withdraw = async () => {
    setBusy(true);
    try {
      const updated = await seekerApi.withdraw(withdrawing.id);
      setApps((list) => list.map((a) => (a.id === updated.id ? updated : a)));
      notify('Application withdrawn');
    } catch (err) {
      notify(await errorMessage(err), 'error');
    } finally {
      setBusy(false);
      setWithdrawing(null);
    }
  };

  if (error) return <div className="container section"><ErrorBox message={error} /></div>;
  if (!apps) return <Spinner />;

  const active = apps.filter((a) => !FINAL.includes(a.status));
  const shown = filter === 'ALL' ? apps : filter === 'ACTIVE' ? active : apps.filter((a) => FINAL.includes(a.status));

  return (
    <div className="container section">
      <h1>My applications</h1>
      <div className="tabs">
        {[
          ['ALL', `All (${apps.length})`],
          ['ACTIVE', `In progress (${active.length})`],
          ['CLOSED', `Closed (${apps.length - active.length})`],
        ].map(([k, label]) => (
          <button key={k} className={`tab ${filter === k ? 'active' : ''}`} onClick={() => setFilter(k)}>
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={apps.length === 0 ? "You haven't applied to any jobs yet" : 'Nothing here'}
          action={<Link to="/jobs" className="btn btn-primary">Browse jobs</Link>}
        />
      ) : (
        <div className="stack">
          {shown.map((a) => (
            <article key={a.id} className="card app-card">
              <div className="app-card-head">
                <div>
                  <Link to={`/jobs/${a.job.id}`} className="job-title">{a.job.title}</Link>
                  <div className="muted">
                    {a.job.companyName} · {a.job.location} · {JOB_TYPES[a.job.jobType]}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>
              {!['REJECTED', 'WITHDRAWN'].includes(a.status) && <Progress status={a.status} />}
              <div className="app-card-foot">
                <span className="muted small">
                  Applied {formatDate(a.appliedAt)} · Updated {timeAgo(a.updatedAt)}
                </span>
                {!FINAL.includes(a.status) && (
                  <button className="btn btn-ghost btn-sm text-danger" onClick={() => setWithdrawing(a)}>
                    Withdraw
                  </button>
                )}
                {a.status === 'WITHDRAWN' && a.job.status === 'ACTIVE' && (
                  <Link to={`/jobs/${a.job.id}`} className="btn btn-ghost btn-sm">Re-apply</Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {withdrawing && (
        <ConfirmModal
          title="Withdraw application?"
          message={`Withdraw your application for "${withdrawing.job.title}" at ${withdrawing.job.companyName}?`}
          confirmLabel="Withdraw"
          danger
          busy={busy}
          onConfirm={withdraw}
          onClose={() => setWithdrawing(null)}
        />
      )}
    </div>
  );
}

function Progress({ status }) {
  const idx = PIPELINE.indexOf(status);
  return (
    <ol className="progress" aria-label="Application progress">
      {PIPELINE.map((s, i) => (
        <li key={s} className={i <= idx ? 'done' : ''}>
          <span className="dot" />
          <span className="label">{s.charAt(0) + s.slice(1).toLowerCase()}</span>
        </li>
      ))}
    </ol>
  );
}
