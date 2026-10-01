import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { jobsApi } from '../api/api.js';
import { errorMessage } from '../api/client.js';
import JobCard from '../components/JobCard.jsx';
import { CompanyLogo, EmptyState, ErrorBox, Spinner } from '../components/Common.jsx';

export default function CompanyPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    jobsApi
      .company(id)
      .then(setData)
      .catch(async (err) => setError(await errorMessage(err, 'Company not found')));
  }, [id]);

  if (error) return <div className="container section"><ErrorBox message={error} /></div>;
  if (!data) return <Spinner />;
  const { company, openJobs } = data;

  return (
    <div className="container section">
      <div className="card company-hero">
        <CompanyLogo name={company.name} url={company.logoUrl} size={80} />
        <div>
          <h1>{company.name}</h1>
          <p className="muted">
            {[company.industry, company.location, company.companySize && `${company.companySize} employees`]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {company.website && (
            <a href={company.website} target="_blank" rel="noreferrer noopener">
              {company.website}
            </a>
          )}
        </div>
      </div>
      {company.description && (
        <div className="card">
          <h2>About</h2>
          <div className="prose">{company.description}</div>
        </div>
      )}
      <h2>Open positions ({openJobs.length})</h2>
      {openJobs.length === 0 ? (
        <EmptyState title="No open positions right now" />
      ) : (
        <div className="stack">
          {openJobs.map((j) => (
            <JobCard key={j.id} job={j} />
          ))}
        </div>
      )}
    </div>
  );
}
