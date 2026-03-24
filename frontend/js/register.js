import { apiRequest, normalizeApiError } from './api.js';

const REGISTER_STORAGE_KEY = 'sci_user';

function setLoadingState(buttonId, isLoading, loadingText, defaultText) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  button.disabled = isLoading;
  button.textContent = isLoading ? loadingText : defaultText;
}

function readRegisterFormValues() {
  const name = (document.getElementById('name')?.value || '').trim();
  const email = (document.getElementById('email')?.value || '').trim();
  const password = document.getElementById('password')?.value || '';
  const role = document.querySelector('input[name="role"]:checked')?.value || 'student';

  return { name, email, password, role };
}

function validateRegisterInput({ name, email, password }) {
  if (!name || !email || !password) {
    return 'Please fill in name, email, and password.';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters.';
  }

  return null;
}

function setRegisterStatus(message, type) {
  const statusEl = document.getElementById('registerStatus');
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.style.color = type === 'error' ? '#b91c1c' : '#166534';
}

async function registerUser() {
  const payload = readRegisterFormValues();
  const validationError = validateRegisterInput(payload);

  if (validationError) {
    setRegisterStatus(validationError, 'error');
    alert(validationError);
    return;
  }

  setLoadingState('registerBtn', true, 'Registering...', 'Register');
  setRegisterStatus('Creating your account...', 'success');

  try {
    const response = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: payload,
    });

    const userData = {
      token: response.token || null,
      user: response.user || null,
    };

    localStorage.setItem(REGISTER_STORAGE_KEY, JSON.stringify(userData));
    setRegisterStatus('Registration successful!', 'success');
    alert('Registration successful!');
  } catch (error) {
    const message = normalizeApiError(error);
    setRegisterStatus(message, 'error');
    alert(`Registration failed: ${message}`);
  } finally {
    setLoadingState('registerBtn', false, 'Registering...', 'Register');
  }
}

window.registerUser = registerUser;

export { registerUser };
