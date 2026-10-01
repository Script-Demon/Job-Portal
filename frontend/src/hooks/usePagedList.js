import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { errorMessage } from '../api/client.js';

/**
 * Loads a paged admin list whose filters live in the URL query string.
 * `keys` are the filter names to read from the URL besides `page`.
 */
export default function usePagedList(fetcher, keys) {
  const [sp, setSp] = useSearchParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const filters = Object.fromEntries(keys.map((k) => [k, sp.get(k) || '']));
  const page = Number(sp.get('page') || 0);
  const key = sp.toString();

  const reload = useCallback(() => {
    setError('');
    fetcher({ ...Object.fromEntries(keys.map((k) => [k, sp.get(k) || ''])), page: Number(sp.get('page') || 0) })
      .then(setData)
      .catch(async (err) => setError(await errorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(reload, [reload]);

  const setFilters = (changes) => {
    const next = new URLSearchParams(sp);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setSp(next);
  };

  return { data, setData, error, filters, page, setFilters, reload };
}
