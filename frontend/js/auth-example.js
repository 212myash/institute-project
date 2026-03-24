import { apiRequest } from './api.js';

export async function registerUser({ name, email, password, role = 'student' }) {
  try {
    const result = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: { name, email, password, role },
    });

    console.log('Register success:', result);
    return result;
  } catch (error) {
    console.error('Register failed:', error.message);
    throw error;
  }
}

export async function loginUser({ email, password }) {
  try {
    const result = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    });

    // Save logged in user for frontend usage
    if (result.user) {
      localStorage.setItem('user', JSON.stringify(result.user));
    }

    console.log('Login success:', result);
    return result;
  } catch (error) {
    console.error('Login failed:', error.message);
    throw error;
  }
}

// Example usage:
// registerUser({ name: 'Yash Raj', email: '212myashraj@gmail.com', password: 'test123', role: 'student' });
// loginUser({ email: '212myashraj@gmail.com', password: 'test123' });
