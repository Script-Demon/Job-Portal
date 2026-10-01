import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { seekerApi } from '../api/api.js';
import { errorMessage } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

/** Returns a toggle(job) that saves/unsaves and calls onChange(jobId, saved) on success. */
export default function useSaveToggle(onChange) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const notify = useToast();
  const [busyId, setBusyId] = useState(null);

  const toggle = async (job) => {
    if (!user) {
      navigate('/login', { state: { from: `/jobs/${job.id}` } });
      return;
    }
    setBusyId(job.id);
    try {
      if (job.saved) await seekerApi.unsave(job.id);
      else await seekerApi.save(job.id);
      onChange(job.id, !job.saved);
      notify(job.saved ? 'Removed from saved jobs' : 'Job saved');
    } catch (err) {
      notify(await errorMessage(err), 'error');
    } finally {
      setBusyId(null);
    }
  };

  // Only job seekers can bookmark; guests are redirected to log in.
  const enabled = !user || user.role === 'JOB_SEEKER';
  return { toggle: enabled ? toggle : null, busyId };
}
