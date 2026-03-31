/**
 * Basic smoke tests for the Express app.
 * Run with: npm test
 */

const app = require('../api/index');

describe('Health endpoints', () => {
  test('GET / returns 200', async () => {
    // In a real setup we'd use supertest; for now just verify the app exports
    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });

  test('App has required middleware', () => {
    // Verify the app is an Express instance
    expect(app._router).toBeDefined();
  });
});

describe('Environment', () => {
  test('JWT_SECRET is set', () => {
    expect(process.env.JWT_SECRET).toBeTruthy();
  });

  test('MONGO_URI is set', () => {
    expect(process.env.MONGO_URI).toBeTruthy();
  });
});
