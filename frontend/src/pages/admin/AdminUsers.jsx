import { useState } from 'react';
import { adminApi } from '../../api/api.js';
import { errorMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../components/Toast.jsx';
import { ConfirmModal, EmptyState, ErrorBox, Pagination, Spinner } from '../../components/Common.jsx';
import usePagedList from '../../hooks/usePagedList.js';
import { formatDate, initials, ROLES } from '../../utils/format.js';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const notify = useToast();
  const { data, setData, error, filters, page, setFilters, reload } = usePagedList(adminApi.users, ['q', 'role']);
  const [q, setQ] = useState(filters.q);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const replace = (u) => setData((d) => ({ ...d, content: d.content.map((x) => (x.id === u.id ? u : x)) }));

  const run = async () => {
    setBusy(true);
    const { action, user } = confirm;
    try {
      if (action === 'delete') {
        await adminApi.deleteUser(user.id);
        notify(`Deleted ${user.email}`);
        reload();
      } else {
        replace(await adminApi.setUserEnabled(user.id, action === 'enable'));
        notify(`${action === 'enable' ? 'Enabled' : 'Disabled'} ${user.email}`);
      }
    } catch (err) {
      notify(await errorMessage(err), 'error');
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  return (
    <div className="container section">
      <h1>Users</h1>
      <form
        className="toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters({ q });
        }}
      >
        <input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
        <select value={filters.role} onChange={(e) => setFilters({ role: e.target.value })} aria-label="Filter by role">
          <option value="">All roles</option>
          {Object.entries(ROLES).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button className="btn btn-primary">Search</button>
      </form>

      <ErrorBox message={error} />
      {!data ? (
        !error && <Spinner />
      ) : data.content.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="table-wrap card">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {data.content.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="person">
                      <span className="avatar">{initials(u.fullName)}</span>
                      <div>
                        <div className="strong">{u.fullName}</div>
                        <div className="muted small">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge role-${u.role.toLowerCase()}`}>{ROLES[u.role]}</span></td>
                  <td className="nowrap">{formatDate(u.createdAt)}</td>
                  <td>
                    <span className={`badge ${u.enabled ? 'job-active' : 'job-removed'}`}>
                      {u.enabled ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="row-actions">
                    {u.id !== me.id && (
                      <>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirm({ action: u.enabled ? 'disable' : 'enable', user: u })}
                        >
                          {u.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button className="btn btn-ghost btn-sm text-danger" onClick={() => setConfirm({ action: 'delete', user: u })}>
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={page} totalPages={data.totalPages} onChange={(p) => setFilters({ page: String(p) })} />}

      {confirm && (
        <ConfirmModal
          title={`${confirm.action[0].toUpperCase() + confirm.action.slice(1)} user?`}
          message={
            confirm.action === 'delete'
              ? `Permanently delete ${confirm.user.email}? Their profile, company, job postings and applications will also be deleted.`
              : confirm.action === 'disable'
                ? `${confirm.user.email} will be signed out and unable to log in.`
                : `${confirm.user.email} will be able to log in again.`
          }
          confirmLabel={confirm.action[0].toUpperCase() + confirm.action.slice(1)}
          danger={confirm.action !== 'enable'}
          busy={busy}
          onConfirm={run}
          onClose={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
