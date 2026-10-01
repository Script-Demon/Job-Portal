import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { seekerApi } from '../../api/api.js';
import { errorMessage } from '../../api/client.js';
import JobCard from '../../components/JobCard.jsx';
import { EmptyState, ErrorBox, Spinner } from '../../components/Common.jsx';
import useSaveToggle from '../../hooks/useSaveToggle.js';

export default function SavedJobs() {
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    seekerApi.savedJobs().then(setJobs).catch(async (err) => setError(await errorMessage(err)));
  }, []);

  const { toggle, busyId } = useSaveToggle((id, saved) => {
    if (!saved) setJobs((list) => list.filter((j) => j.id !== id));
  });

  if (error) return <div className="container section"><ErrorBox message={error} /></div>;
  if (!jobs) return <Spinner />;

  return (
    <div className="container section">
      <h1>Saved jobs</h1>
      {jobs.length === 0 ? (
        <EmptyState
          title="No saved jobs yet"
          action={<Link to="/jobs" className="btn btn-primary">Browse jobs</Link>}
        >
          Tap the ☆ on any job to keep it here for later.
        </EmptyState>
      ) : (
        <div className="stack">
          {jobs.map((j) => (
            <div key={j.id}>
              {j.status === 'CLOSED' && <div className="closed-note">No longer accepting applications</div>}
              <JobCard job={j} onToggleSave={toggle} saving={busyId === j.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
