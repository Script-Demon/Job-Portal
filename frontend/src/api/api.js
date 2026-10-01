import client from './client.js';

const data = (p) => p.then((r) => r.data);

/** Serialises arrays as repeated params (?type=A&type=B), which Spring binds to List. */
function params(obj) {
  const sp = new URLSearchParams();
  Object.entries(obj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === false) return;
    if (Array.isArray(v)) v.forEach((item) => sp.append(k, item));
    else sp.append(k, v);
  });
  return sp;
}

export const authApi = {
  login: (body) => data(client.post('/auth/login', body)),
  register: (body) => data(client.post('/auth/register', body)),
  me: () => data(client.get('/auth/me')),
};

export const jobsApi = {
  search: (filters) => data(client.get('/jobs', { params: params(filters) })),
  get: (id) => data(client.get(`/jobs/${id}`)),
  apply: (id, coverLetter) => data(client.post(`/jobs/${id}/apply`, { coverLetter })),
  company: (id) => data(client.get(`/companies/${id}`)),
};

export const seekerApi = {
  profile: () => data(client.get('/seeker/profile')),
  updateProfile: (body) => data(client.put('/seeker/profile', body)),
  uploadResume: (file) => {
    const form = new FormData();
    form.append('file', file);
    return data(client.post('/seeker/profile/resume', form));
  },
  deleteResume: () => data(client.delete('/seeker/profile/resume')),
  downloadResume: () => client.get('/seeker/profile/resume', { responseType: 'blob' }),
  applications: () => data(client.get('/seeker/applications')),
  withdraw: (id) => data(client.patch(`/seeker/applications/${id}/withdraw`)),
  savedJobs: () => data(client.get('/seeker/saved-jobs')),
  save: (jobId) => client.put(`/seeker/saved-jobs/${jobId}`),
  unsave: (jobId) => client.delete(`/seeker/saved-jobs/${jobId}`),
};

export const employerApi = {
  company: () => data(client.get('/employer/company')),
  saveCompany: (body) => data(client.put('/employer/company', body)),
  jobs: () => data(client.get('/employer/jobs')),
  job: (id) => data(client.get(`/employer/jobs/${id}`)),
  createJob: (body) => data(client.post('/employer/jobs', body)),
  updateJob: (id, body) => data(client.put(`/employer/jobs/${id}`, body)),
  deleteJob: (id) => client.delete(`/employer/jobs/${id}`),
  applicants: (jobId) => data(client.get(`/employer/jobs/${jobId}/applications`)),
  setStatus: (appId, status) => data(client.patch(`/employer/applications/${appId}/status`, { status })),
  downloadResume: (appId) => client.get(`/employer/applications/${appId}/resume`, { responseType: 'blob' }),
};

export const adminApi = {
  stats: () => data(client.get('/admin/stats')),
  users: (filters) => data(client.get('/admin/users', { params: params(filters) })),
  setUserEnabled: (id, enabled) => data(client.patch(`/admin/users/${id}/status`, { enabled })),
  deleteUser: (id) => client.delete(`/admin/users/${id}`),
  companies: (filters) => data(client.get('/admin/companies', { params: params(filters) })),
  deleteCompany: (id) => client.delete(`/admin/companies/${id}`),
  jobs: (filters) => data(client.get('/admin/jobs', { params: params(filters) })),
  setJobStatus: (id, status, reason) => data(client.patch(`/admin/jobs/${id}/status`, { status, reason })),
  deleteJob: (id) => client.delete(`/admin/jobs/${id}`),
};
