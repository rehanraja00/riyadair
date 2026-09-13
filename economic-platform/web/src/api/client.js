const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (data && data.error) || res.statusText;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }

  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: () => request('/auth/me'),

  listCategories: () => request('/categories'),
  createCategory: (payload) => request('/categories', { method: 'POST', body: payload }),
  updateCategory: (id, payload) => request(`/categories/${id}`, { method: 'PUT', body: payload }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  listIndicators: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/indicators${qs ? `?${qs}` : ''}`);
  },
  getIndicator: (id) => request(`/indicators/${id}`),
  createIndicator: (payload) => request('/indicators', { method: 'POST', body: payload }),
  updateIndicator: (id, payload) => request(`/indicators/${id}`, { method: 'PUT', body: payload }),
  deleteIndicator: (id) => request(`/indicators/${id}`, { method: 'DELETE' }),
  addDataPoints: (id, points) => request(`/indicators/${id}/datapoints`, { method: 'POST', body: points }),
  deleteDataPoint: (id, pointId) => request(`/indicators/${id}/datapoints/${pointId}`, { method: 'DELETE' }),

  listViews: () => request('/views'),
  getView: (slug) => request(`/views/${slug}`),
  createView: (payload) => request('/views', { method: 'POST', body: payload }),
  updateView: (id, payload) => request(`/views/${id}`, { method: 'PUT', body: payload }),
  deleteView: (id) => request(`/views/${id}`, { method: 'DELETE' }),
  setViewWidgets: (id, widgets) => request(`/views/${id}/widgets`, { method: 'PUT', body: widgets }),
};
