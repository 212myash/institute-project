import { apiRequest, normalizeApiError } from './api.js';

const LOGIN_STORAGE_KEY = 'sci_user';

function setLoadingState(buttonId, isLoading, loadingText, defaultText) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : defaultText;
}

function readLoginFormValues() {
  const email = (document.getElementById('loginEmail')?.value || '').trim();
  const password = document.getElementById('loginPassword')?.value || '';

  return { email, password };
}

function validateLoginInput({ email, password }) {
  if (!email || !password) {
    return 'Please fill in email and password.';
  }

  return null;
}

function setLoginStatus(message, type) {
  const statusEl = document.getElementById('loginStatus');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.style.color = type === 'error' ? '#b91c1c' : '#166534';
}

async function loginUser() {
  const payload = readLoginFormValues();
  const validationError = validateLoginInput(payload);

  if (validationError) {
    setLoginStatus(validationError, 'error');
    alert(validationError);
    return;
  }

  setLoadingState('loginBtn', true, 'Logging in...', 'Login');
  setLoginStatus('Logging in...', 'success');

  try {
    const response = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: payload,
    });

    if (!response.token || !response.user) {
      throw new Error('Login response is incomplete. Please try again.');
    }

    localStorage.setItem(
      LOGIN_STORAGE_KEY,
      JSON.stringify({ token: response.token, user: response.user })
    );

    setLoginStatus('Login successful!', 'success');
    alert('Login successful!');
  } catch (error) {
    const message = normalizeApiError(error);
    const finalMessage =
      /invalid|unauthorized|credentials/i.test(message)
        ? 'Invalid credentials. Please check your email and password.'
        : message;

    setLoginStatus(finalMessage, 'error');
    alert(`Login failed: ${finalMessage}`);
  } finally {
    setLoadingState('loginBtn', false, 'Logging in...', 'Login');
  }
}

window.loginUser = loginUser;

export { loginUser };
