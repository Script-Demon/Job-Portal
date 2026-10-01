import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { jobsApi } from '../api/api.js';
import { errorMessage } from '../api/client.js';
import JobCard from '../components/JobCard.jsx';
import { EmptyState, ErrorBox, Pagination, Spinner } from '../components/Common.jsx';
import useSaveToggle from '../hooks/useSaveToggle.js';
import { useAuth } from '../context/AuthContext.jsx';
import { JOB_TYPES, LEVELS } from '../utils/format.js';

const SALARY_OPTIONS = [
  ['', 'Any'],
  ['40000', '$40k+'],
  ['60000', '$60k+'],
  ['80000', '$80k+'],
  ['100000', '$100k+'],
  ['150000', '$150k+'],
];

/** Reads the current filters from the URL so searches are shareable and survive refresh. */
function readFilters(sp) {
  return {
    q: sp.get('q') || '',
    location: sp.get('location') || '',
    type: sp.getAll('type'),
    level: sp.getAll('level'),
    minSalary: sp.get('minSalary') || '',
    maxSalary: sp.get('maxSalary') || '',
    skills: sp.get('skills') || '',
    remote: sp.get('remote') === 'true',
    sort: sp.get('sort') || 'newest',
    page: Number(sp.get('page') || 0),
  };
}

export default function Jobs() {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const filters = readFilters(sp);
  const [draft, setDraft] = useState({ q: filters.q, location: filters.location, skills: filters.skills });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const key = sp.toString();

  useEffect(() => {
    const f = readFilters(sp);
    setDraft({ q: f.q, location: f.location, skills: f.skills });
    setResult(null);
    setError('');
    jobsApi
      .search({
        ...f,
        skills: f.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        size: 10,
      })
      .then(setResult)
      .catch(async (err) => setError(await errorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, user]);

  const update = (changes) => {
    const next = { ...filters, page: 0, ...changes };
    const out = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (Array.isArray(v)) v.forEach((x) => out.append(k, x));
      else if (v !== '' && v !== false && v !== null && !(k === 'page' && v === 0) && !(k === 'sort' && v === 'newest'))
        out.set(k, v);
    });
    setSp(out);
  };

  const toggleIn = (list, value) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

  const { toggle, busyId } = useSaveToggle((id, saved) =>
    setResult((r) => ({ ...r, content: r.content.map((j) => (j.id === id ? { ...j, saved } : j)) })),
  );

  const submitSearch = (e) => {
    e.preventDefault();
    update(draft);
  };

  const activeCount =
    filters.type.length + filters.level.length + (filters.minSalary ? 1 : 0) + (filters.maxSalary ? 1 : 0) +
    (filters.skills ? 1 : 0) + (filters.remote ? 1 : 0);

  return (
    <div className="container section">
      <form className="search-bar card" onSubmit={submitSearch}>
        <input
          aria-label="Keywords"
          placeholder="Job title, keywords or company"
          value={draft.q}
          onChange={(e) => setDraft({ ...draft, q: e.target.value })}
        />
        <input
          aria-label="Location"
          placeholder="Location"
          value={draft.location}
          onChange={(e) => setDraft({ ...draft, location: e.target.value })}
        />
        <button className="btn btn-primary">Search</button>
      </form>

      <div className="jobs-layout">
        <aside className={`filters card ${showFilters ? 'open' : ''}`}>
          <div className="filters-head">
            <h3>Filters</h3>
            {activeCount > 0 && (
              <button
                className="link-btn"
                onClick={() =>
                  update({ type: [], level: [], minSalary: '', maxSalary: '', skills: '', remote: false })
                }
              >
                Clear all
              </button>
            )}
          </div>

          <fieldset>
            <legend>Job type</legend>
            {Object.entries(JOB_TYPES).map(([value, label]) => (
              <label key={value} className="check">
                <input
                  type="checkbox"
                  checked={filters.type.includes(value)}
                  onChange={() => update({ type: toggleIn(filters.type, value) })}
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Experience</legend>
            {Object.entries(LEVELS).map(([value, label]) => (
              <label key={value} className="check">
                <input
                  type="checkbox"
                  checked={filters.level.includes(value)}
                  onChange={() => update({ level: toggleIn(filters.level, value) })}
                />
                {label}
              </label>
            ))}
          </fieldset>

          <fieldset>
            <legend>Salary (annual)</legend>
            <label className="sub-label" htmlFor="minSalary">Minimum</label>
            <select id="minSalary" value={filters.minSalary} onChange={(e) => update({ minSalary: e.target.value })}>
              {SALARY_OPTIONS.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
            <label className="sub-label" htmlFor="maxSalary">Maximum</label>
            <input
              id="maxSalary"
              type="number"
              min="0"
              step="5000"
              placeholder="e.g. 120000"
              value={filters.maxSalary}
              onChange={(e) => update({ maxSalary: e.target.value })}
            />
          </fieldset>

          <fieldset>
            <legend>Skills</legend>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                update({ skills: draft.skills });
              }}
            >
              <input
                aria-label="Skills"
                placeholder="e.g. Java, React"
                value={draft.skills}
                onChange={(e) => setDraft({ ...draft, skills: e.target.value })}
                onBlur={() => draft.skills !== filters.skills && update({ skills: draft.skills })}
              />
              <small className="hint">Comma-separated; matches any</small>
            </form>
          </fieldset>

          <fieldset>
            <label className="check">
              <input type="checkbox" checked={filters.remote} onChange={(e) => update({ remote: e.target.checked })} />
              Remote only
            </label>
          </fieldset>
        </aside>

        <section className="results">
          <div className="results-head">
            <span className="muted">
              {result ? `${result.totalElements} job${result.totalElements === 1 ? '' : 's'} found` : ' '}
            </span>
            <div className="results-tools">
              <button className="btn btn-ghost btn-sm filters-toggle" onClick={() => setShowFilters((s) => !s)}>
                Filters{activeCount ? ` (${activeCount})` : ''}
              </button>
              <label className="sort">
                Sort
                <select value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
                  <option value="newest">Newest</option>
                  <option value="salary_desc">Highest salary</option>
                  <option value="salary_asc">Lowest salary</option>
                  <option value="oldest">Oldest</option>
                </select>
              </label>
            </div>
          </div>

          <ErrorBox message={error} />
          {!result && !error && <Spinner />}
          {result && result.content.length === 0 && (
            <EmptyState title="No jobs match your search">Try removing a filter or using different keywords.</EmptyState>
          )}
          <div className="stack">
            {result?.content.map((j) => (
              <JobCard key={j.id} job={j} onToggleSave={toggle} saving={busyId === j.id} />
            ))}
          </div>
          {result && (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              onChange={(p) => {
                update({ page: p });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </section>
      </div>
    </div>
  );
}
