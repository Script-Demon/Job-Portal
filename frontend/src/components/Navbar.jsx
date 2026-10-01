import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { initials, ROLES } from '../utils/format.js';

const LINKS = {
  GUEST: [{ to: '/jobs', label: 'Find jobs' }],
  JOB_SEEKER: [
    { to: '/jobs', label: 'Find jobs' },
    { to: '/seeker/applications', label: 'My applications' },
    { to: '/seeker/saved', label: 'Saved jobs' },
    { to: '/seeker/profile', label: 'Profile' },
  ],
  EMPLOYER: [
    { to: '/employer', label: 'My jobs', end: true },
    { to: '/employer/jobs/new', label: 'Post a job' },
    { to: '/employer/company', label: 'Company' },
  ],
  ADMIN: [
    { to: '/admin', label: 'Dashboard', end: true },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/companies', label: 'Companies' },
    { to: '/admin/jobs', label: 'Jobs' },
  ],
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const links = LINKS[user?.role || 'GUEST'];
  const close = () => setOpen(false);

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={close}>
          <span className="brand-mark">JP</span> JobPortal
        </Link>
        <button className="nav-toggle" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu">
          ☰
        </button>
        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} onClick={close}>
              {l.label}
            </NavLink>
          ))}
          <div className="nav-auth">
            {user ? (
              <>
                <span className="nav-user" title={`${user.email} · ${ROLES[user.role]}`}>
                  <span className="avatar">{initials(user.fullName)}</span>
                  <span className="nav-user-name">{user.fullName}</span>
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    close();
                    logout();
                  }}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm" onClick={close}>
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm" onClick={close}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
