const BASE_URL = 'https://institute-project-five.vercel.app';

function normalizeApiError(error) {
  if (error.name === 'TypeError') {
    return 'Network error. Please check your internet connection and try again.';
  }

  return error.message || 'Something went wrong. Please try again.';
}

async function apiRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
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

  let response;
  try {
    response = await fetch(url, config);
  } catch (error) {
    throw new Error(normalizeApiError(error));
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}

export { BASE_URL, apiRequest, normalizeApiError };
