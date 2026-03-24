import { apiRequest } from './api.js';

let lastRequestCount = null;

export async function checkAdminRequests() {
  try {
    const result = await apiRequest('/api/admin/requests');
    const requests = result.data || [];
    const currentCount = requests.length;

    if (lastRequestCount !== null && currentCount > lastRequestCount) {
      const newItems = currentCount - lastRequestCount;
      console.log(`[Admin Notifications] ${newItems} new request(s) received.`);
      alert(`${newItems} new contact request(s) arrived.`);
    } else {
      console.log('[Admin Notifications] No new requests.');
    }

    lastRequestCount = currentCount;
  } catch (error) {
    console.error('[Admin Notifications] Polling failed:', error.message);
  }
}

export function startAdminRequestPolling(intervalMs = 30000) {
  console.log(`[Admin Notifications] Polling started every ${intervalMs / 1000}s`);
  checkAdminRequests();
  return setInterval(checkAdminRequests, intervalMs);
}

// Example usage:
// const pollingId = startAdminRequestPolling(30000);
