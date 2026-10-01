export const JOB_TYPES = {
  FULL_TIME: 'Full-time',
  PART_TIME: 'Part-time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  TEMPORARY: 'Temporary',
};

export const LEVELS = {
  ENTRY: 'Entry level',
  MID: 'Mid level',
  SENIOR: 'Senior',
  LEAD: 'Lead / Manager',
};

export const APPLICATION_STATUSES = {
  APPLIED: 'Applied',
  REVIEWING: 'Under review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW: 'Interview',
  OFFERED: 'Offered',
  HIRED: 'Hired',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
};

export const ROLES = {
  JOB_SEEKER: 'Job seeker',
  EMPLOYER: 'Employer',
  ADMIN: 'Admin',
};

const money = (n) =>
  n >= 1000 ? `$${Math.round(n / 1000)}k` : `$${n.toLocaleString()}`;

export function formatSalary(min, max) {
  if (min == null && max == null) return 'Salary not disclosed';
  if (min != null && max != null) return min === max ? `${money(min)} / yr` : `${money(min)} – ${money(max)} / yr`;
  if (min != null) return `From ${money(min)} / yr`;
  return `Up to ${money(max)} / yr`;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const units = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  for (const [name, secs] of units) {
    const v = Math.floor(seconds / secs);
    if (v >= 1) return `${v} ${name}${v > 1 ? 's' : ''} ago`;
  }
  return 'just now';
}

export const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

/** Saves an axios blob response using the filename from Content-Disposition. */
export function saveBlobResponse(res, fallbackName = 'resume') {
  const header = res.headers['content-disposition'] || '';
  const star = header.match(/filename\*=UTF-8''([^;]+)/i);
  const plain = header.match(/filename="?([^";]+)"?/i);
  const name = star ? decodeURIComponent(star[1]) : plain ? plain[1] : fallbackName;
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
