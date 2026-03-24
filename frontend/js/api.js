const BASE_URL = 'https://your-backend.vercel.app';

async function apiRequest(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  console.log(`[API] ${config.method} ${url} - loading...`);

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.message || `Request failed with status ${response.status}`;
    console.error(`[API] ${config.method} ${url} - error: ${message}`);
    throw new Error(message);
  }

  console.log(`[API] ${config.method} ${url} - success`);
  return data;
}

export { BASE_URL, apiRequest };
