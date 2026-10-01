import { Link, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { homeFor, useAuth } from './context/AuthContext.jsx';
import Home from './pages/Home.jsx';
import Jobs from './pages/Jobs.jsx';
import JobDetail from './pages/JobDetail.jsx';
import CompanyPage from './pages/CompanyPage.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/seeker/Profile.jsx';
import Applications from './pages/seeker/Applications.jsx';
import SavedJobs from './pages/seeker/SavedJobs.jsx';
import EmployerDashboard from './pages/employer/Dashboard.jsx';
import CompanyProfile from './pages/employer/CompanyProfile.jsx';
import JobForm from './pages/employer/JobForm.jsx';
import Applicants from './pages/employer/Applicants.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminCompanies from './pages/admin/AdminCompanies.jsx';
import AdminJobs from './pages/admin/AdminJobs.jsx';

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to={homeFor(user.role)} replace /> : children;
}

function NotFound() {
  return (
    <div className="container section center">
      <h1>Page not found</h1>
      <p className="muted">The page you are looking for doesn’t exist.</p>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </div>
  );
}

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/companies/:id" element={<CompanyPage />} />
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

          <Route element={<ProtectedRoute roles={['JOB_SEEKER']} />}>
            <Route path="/seeker/profile" element={<Profile />} />
            <Route path="/seeker/applications" element={<Applications />} />
            <Route path="/seeker/saved" element={<SavedJobs />} />
          </Route>

          <Route element={<ProtectedRoute roles={['EMPLOYER']} />}>
            <Route path="/employer" element={<EmployerDashboard />} />
            <Route path="/employer/company" element={<CompanyProfile />} />
            <Route path="/employer/jobs/new" element={<JobForm />} />
            <Route path="/employer/jobs/:id/edit" element={<JobForm />} />
            <Route path="/employer/jobs/:id/applicants" element={<Applicants />} />
          </Route>

          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/companies" element={<AdminCompanies />} />
            <Route path="/admin/jobs" element={<AdminJobs />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="footer">
        <div className="container">© {new Date().getFullYear()} JobPortal</div>
      </footer>
    </>
  );
}
