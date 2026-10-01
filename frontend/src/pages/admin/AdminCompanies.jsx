import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/api.js';
import { errorMessage } from '../../api/client.js';
import { useToast } from '../../components/Toast.jsx';
import { CompanyLogo, ConfirmModal, EmptyState, ErrorBox, Pagination, Spinner } from '../../components/Common.jsx';
import usePagedList from '../../hooks/usePagedList.js';
import { formatDate } from '../../utils/format.js';

export default function AdminCompanies() {
  const notify = useToast();
  const { data, error, filters, page, setFilters, reload } = usePagedList(adminApi.companies, ['q']);
  const [q, setQ] = useState(filters.q);
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const remove = async () => {
    setBusy(true);
    try {
      await adminApi.deleteCompany(deleting.id);
      notify(`Deleted ${deleting.name}`);
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
      <h1>Companies</h1>
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({ q });
        }}
      >
        <input placeholder="Search company or owner email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search companies" />
        <button className="btn btn-primary">Search</button>
      </form>

      <ErrorBox message={error} />
      {!data ? (
        !error && <Spinner />
      ) : data.content.length === 0 ? (
        <EmptyState title="No companies found" />
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Owner</th>
                <th>Jobs</th>
                <th>Created</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.content.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div className="person">
                      <CompanyLogo name={c.name} url={c.logoUrl} size={36} />
                      <div>
                        <Link to={`/companies/${c.id}`} className="strong">{c.name}</Link>
                        <div className="muted small">{[c.industry, c.location].filter(Boolean).join(' · ')}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div>{c.ownerName}</div>
                    <div className="muted small">{c.ownerEmail}</div>
                  </td>
                  <td>{c.jobCount}</td>
                  <td className="nowrap">{formatDate(c.createdAt)}</td>
                  <td className="row-actions">
                    <Link to={`/admin/jobs?q=${encodeURIComponent(c.name)}`} className="btn btn-ghost btn-sm">Jobs</Link>
                    <button className="btn btn-ghost btn-sm text-danger" onClick={() => setDeleting(c)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={page} totalPages={data.totalPages} onChange={(p) => setFilters({ page: String(p) })} />}

      {deleting && (
        <ConfirmModal
          title="Delete company?"
          message={`Delete ${deleting.name} and its ${deleting.jobCount} job posting(s), including all applications? The employer account is kept.`}
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
