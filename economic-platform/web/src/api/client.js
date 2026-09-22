const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
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

  addTargets: (id, points) => request(`/indicators/${id}/targets`, { method: 'POST', body: points }),
  deleteTarget: (id, targetId) => request(`/indicators/${id}/targets/${targetId}`, { method: 'DELETE' }),
  addForecast: (id, points) => request(`/indicators/${id}/forecasts`, { method: 'POST', body: points }),
  addBaseline: (id, payload) => request(`/indicators/${id}/baselines`, { method: 'POST', body: payload }),
  activateBaseline: (id, baselineId) =>
    request(`/indicators/${id}/baselines/${baselineId}/activate`, { method: 'POST' }),

  listViews: () => request('/views'),
  getView: (slug) => request(`/views/${slug}`),
  createView: (payload) => request('/views', { method: 'POST', body: payload }),
  updateView: (id, payload) => request(`/views/${id}`, { method: 'PUT', body: payload }),
  deleteView: (id) => request(`/views/${id}`, { method: 'DELETE' }),
  setViewWidgets: (id, widgets) => request(`/views/${id}/widgets`, { method: 'PUT', body: widgets }),

  listSections: () => request('/sections'),
  createSection: (payload) => request('/sections', { method: 'POST', body: payload }),
  updateSection: (id, payload) => request(`/sections/${id}`, { method: 'PUT', body: payload }),
  deleteSection: (id) => request(`/sections/${id}`, { method: 'DELETE' }),

  listSources: (includeInactive = false) => request(`/sources${includeInactive ? '?includeInactive=true' : ''}`),
  createSource: (payload) => request('/sources', { method: 'POST', body: payload }),
  updateSource: (id, payload) => request(`/sources/${id}`, { method: 'PUT', body: payload }),
  deactivateSource: (id) => request(`/sources/${id}/deactivate`, { method: 'POST' }),
  reactivateSource: (id) => request(`/sources/${id}/reactivate`, { method: 'POST' }),
  mergeSource: (id, intoId) => request(`/sources/${id}/merge`, { method: 'POST', body: { intoId } }),

  listUnits: (includeInactive = false) => request(`/units${includeInactive ? '?includeInactive=true' : ''}`),
  createUnit: (payload) => request('/units', { method: 'POST', body: payload }),
  updateUnit: (id, payload) => request(`/units/${id}`, { method: 'PUT', body: payload }),
  deactivateUnit: (id) => request(`/units/${id}/deactivate`, { method: 'POST' }),
  reactivateUnit: (id) => request(`/units/${id}/reactivate`, { method: 'POST' }),
  mergeUnit: (id, intoId) => request(`/units/${id}/merge`, { method: 'POST', body: { intoId } }),
};
