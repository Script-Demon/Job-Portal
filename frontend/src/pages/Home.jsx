import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobsApi } from '../api/api.js';
import JobCard from '../components/JobCard.jsx';
import { Spinner } from '../components/Common.jsx';
import useSaveToggle from '../hooks/useSaveToggle.js';
import { useAuth } from '../context/AuthContext.jsx';

const POPULAR = ['Java', 'React', 'Python', 'SQL', 'Spring Boot', 'Docker'];

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [location, setLocation] = useState('');
  const [jobs, setJobs] = useState(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    jobsApi
      .search({ size: 5 })
      .then((res) => {
        setJobs(res.content);
        setTotal(res.totalElements);
      })
      .catch(() => setJobs([]));
  }, [user]);

  const { toggle, busyId } = useSaveToggle((id, saved) =>
    setJobs((list) => list.map((j) => (j.id === id ? { ...j, saved } : j))),
  );

  const search = (e) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set('q', q.trim());
    if (location.trim()) sp.set('location', location.trim());
    navigate(`/jobs?${sp}`);
  };

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1>Find the job that fits your life</h1>
          <p className="hero-sub">
            Browse {total > 0 ? `${total} open roles` : 'open roles'} from companies that are hiring now.
          </p>
          <form className="hero-search" onSubmit={search}>
            <input
              aria-label="Job title, keywords or company"
              placeholder="Job title, keywords or company"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <input
              aria-label="City or remote"
              placeholder="City, state or “Remote”"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
            <button className="btn btn-primary">Search jobs</button>
          </form>
          <div className="popular">
            <span>Popular:</span>
            {POPULAR.map((s) => (
              <Link key={s} to={`/jobs?skills=${encodeURIComponent(s)}`} className="chip chip-light">
                {s}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container section">
        <div className="section-head">
          <h2>Latest jobs</h2>
          <Link to="/jobs">View all →</Link>
        </div>
        {jobs === null ? (
          <Spinner />
        ) : jobs.length === 0 ? (
          <p className="muted">No jobs posted yet.</p>
        ) : (
          <div className="stack">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} onToggleSave={toggle} saving={busyId === j.id} />
            ))}
          </div>
        )}
      </section>

      {!user && (
        <section className="container section">
          <div className="cta-grid">
            <div className="card cta">
              <h3>Looking for work?</h3>
              <p className="muted">Create a profile, upload your resume and apply in one click.</p>
              <Link to="/register" className="btn btn-primary">
                Join as a job seeker
              </Link>
            </div>
            <div className="card cta">
              <h3>Hiring?</h3>
              <p className="muted">Post jobs, review applicants and manage your pipeline.</p>
              <Link to="/register?role=EMPLOYER" className="btn btn-outline">
                Post a job
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
