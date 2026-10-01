import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/api.js';
import { errorMessage } from '../../api/client.js';
import { ErrorBox, Spinner } from '../../components/Common.jsx';
import { APPLICATION_STATUSES, JOB_TYPES } from '../../utils/format.js';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.stats().then(setStats).catch(async (err) => setError(await errorMessage(err)));
  }, []);

  if (error) return <div className="container section"><ErrorBox message={error} /></div>;
  if (!stats) return <Spinner />;

  const tiles = [
    { label: 'Users', value: stats.totalUsers, sub: `+${stats.newUsersLast30Days} in 30 days`, to: '/admin/users' },
    { label: 'Job seekers', value: stats.jobSeekers, to: '/admin/users?role=JOB_SEEKER' },
    { label: 'Employers', value: stats.employers, to: '/admin/users?role=EMPLOYER' },
    { label: 'Companies', value: stats.totalCompanies, to: '/admin/companies' },
    { label: 'Jobs', value: stats.totalJobs, sub: `+${stats.newJobsLast30Days} in 30 days`, to: '/admin/jobs' },
    { label: 'Active jobs', value: stats.activeJobs, to: '/admin/jobs?status=ACTIVE' },
    { label: 'Removed jobs', value: stats.removedJobs, to: '/admin/jobs?status=REMOVED' },
    { label: 'Applications', value: stats.totalApplications },
  ];

  return (
    <div className="container section">
      <h1>Platform overview</h1>
      <div className="stat-grid">
        {tiles.map((t) => {
          const body = (
            <>
              <span className="stat-label">{t.label}</span>
              <span className="stat-value">{t.value.toLocaleString()}</span>
              {t.sub && <span className="stat-sub">{t.sub}</span>}
            </>
          );
          return t.to ? (
            <Link key={t.label} to={t.to} className="stat card stat-link">{body}</Link>
          ) : (
            <div key={t.label} className="stat card">{body}</div>
          );
        })}
      </div>

      <div className="grid-2 section-tight">
        <BarList
          title="Applications by status"
          data={Object.entries(stats.applicationsByStatus).map(([k, v]) => [APPLICATION_STATUSES[k], v])}
        />
        <BarList
          title="Jobs by type"
          data={Object.entries(stats.jobsByType).map(([k, v]) => [JOB_TYPES[k], v])}
        />
      </div>
    </div>
  );
}

function BarList({ title, data }) {
  const max = Math.max(1, ...data.map(([, v]) => v));
  return (
    <section className="card">
      <h3>{title}</h3>
      <ul className="bar-list">
        {data.map(([label, value]) => (
          <li key={label}>
            <span className="bar-label">{label}</span>
            <span className="bar-track">
              <span className="bar-fill" style={{ width: `${(value / max) * 100}%` }} />
            </span>
            <span className="bar-value">{value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
