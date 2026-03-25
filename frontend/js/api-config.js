const DEPLOYED_API_ORIGIN = 'https://institute-project-mu.vercel.app';
const API_BASE_STORAGE_KEY = 'sci_api_base';

function normalizeBase(base) {
  if (!base) return '';
  return String(base).trim().replace(/\/+$/, '');
}

function isLocalHost() {
  const host = window.location.hostname;
  return host === 'localhost' || host === '127.0.0.1';
}

function getApiBaseCandidates() {
  const candidates = [];

  const fromStorage = normalizeBase(localStorage.getItem(API_BASE_STORAGE_KEY));
  if (fromStorage) candidates.push(fromStorage);

  const fromGlobal = normalizeBase(window.__API_BASE__);
  if (fromGlobal) candidates.push(fromGlobal);

  if (isLocalHost()) {
    candidates.push('http://localhost:5000');
  }

  // Same-origin API for production deployments where frontend and backend share host
  candidates.push(normalizeBase(window.location.origin));

  // Hard fallback to known deployed backend
  candidates.push(DEPLOYED_API_ORIGIN);

  return Array.from(new Set(candidates.filter(Boolean)));
}

function saveWorkingApiBase(base) {
  const normalized = normalizeBase(base);
  if (!normalized) return;
  localStorage.setItem(API_BASE_STORAGE_KEY, normalized);
}

export {
  getApiBaseCandidates,
  saveWorkingApiBase,
  DEPLOYED_API_ORIGIN,
};
