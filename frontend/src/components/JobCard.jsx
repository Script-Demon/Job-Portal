import { Link } from 'react-router-dom';
import { CompanyLogo } from './Common.jsx';
import { formatSalary, JOB_TYPES, LEVELS, timeAgo } from '../utils/format.js';

export default function JobCard({ job, onToggleSave, saving }) {
  return (
    <article className="card job-card">
      <CompanyLogo name={job.company.name} url={job.company.logoUrl} />
      <div className="job-card-main">
        <Link to={`/jobs/${job.id}`} className="job-title">
          {job.title}
        </Link>
        <div className="muted">
          <Link to={`/companies/${job.company.id}`} className="link-plain">
            {job.company.name}
          </Link>{' '}
          · {job.location}
          {job.remote && <span className="tag tag-green">Remote</span>}
        </div>
        <div className="job-meta">
          <span className="tag">{JOB_TYPES[job.jobType]}</span>
          {job.experienceLevel && <span className="tag">{LEVELS[job.experienceLevel]}</span>}
          <span className="salary">{formatSalary(job.salaryMin, job.salaryMax)}</span>
        </div>
        {job.skills?.length > 0 && (
          <div className="skills">
            {job.skills.slice(0, 6).map((s) => (
              <span key={s} className="chip">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="job-card-side">
        <span className="muted small">{timeAgo(job.createdAt)}</span>
        {job.applied && <span className="badge status-applied">Applied</span>}
        {onToggleSave && (
          <button
            className={`icon-btn save-btn ${job.saved ? 'saved' : ''}`}
            onClick={() => onToggleSave(job)}
            disabled={saving}
            aria-label={job.saved ? 'Remove from saved jobs' : 'Save job'}
            title={job.saved ? 'Saved' : 'Save job'}
          >
            {job.saved ? '★' : '☆'}
          </button>
        )}
      </div>
    </article>
  );
}
