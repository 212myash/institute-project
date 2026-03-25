import { getApiBaseCandidates, saveWorkingApiBase } from './api-config.js';

function normalizeApiError(error) {
  if (error.name === 'TypeError') {
    return 'Network error. Please check your internet connection and try again.';
  }

  return error.message || 'Something went wrong. Please try again.';
}

async function apiRequest(path, options = {}) {
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  };

  if (options.body !== undefined) {
    config.body = JSON.stringify(options.body);
  }

  const candidates = getApiBaseCandidates();
  let networkError = null;

  for (const base of candidates) {
    const url = `${base}${path}`;
    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = data.message || `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      saveWorkingApiBase(base);
      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        networkError = error;
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    networkError
      ? normalizeApiError(networkError)
      : `Unable to connect to API. Checked: ${candidates.join(', ')}`
  );
}

export { apiRequest, normalizeApiError };
