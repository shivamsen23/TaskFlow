const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const app = require('../app');
const prisma = require('../prisma');

let server;
let baseUrl;

async function runTests() {
  console.log('=== Starting Backend Authentication & Authorization Tests ===\n');

  // Start temporary test server on an available port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName}`);
      failed++;
    }
  }

  try {
    // 1. Test Valid Login (Manager)
    const managerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'shivam.sen@busyinfotech.com',
        password: 'Password123!'
      })
    });
    const managerLoginData = await managerLoginRes.json();
    const managerCookie = managerLoginRes.headers.get('set-cookie');

    assert(
      managerLoginRes.status === 200 &&
      managerLoginData.user &&
      managerLoginData.user.role === 'MANAGER' &&
      managerCookie &&
      managerCookie.includes('token='),
      '1. Valid login returns 200, user payload, and HttpOnly auth cookie'
    );

    // Extract token from cookie string for subsequent test requests
    const managerTokenMatch = managerCookie?.match(/token=([^;]+)/);
    const managerToken = managerTokenMatch ? managerTokenMatch[1] : '';

    // 2. Test Invalid Password
    const invalidLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'shivam.sen@busyinfotech.com',
        password: 'WrongPassword!'
      })
    });
    const invalidLoginData = await invalidLoginRes.json();

    assert(
      invalidLoginRes.status === 401 &&
      invalidLoginData.error === 'Invalid email or password',
      '2. Invalid password returns 401 Unauthorized'
    );

    // 3. Test Missing Authentication on Protected Route
    const noAuthRes = await fetch(`${baseUrl}/api/auth/me`);
    const noAuthData = await noAuthRes.json();

    assert(
      noAuthRes.status === 401 &&
      noAuthData.error === 'Authentication required',
      '3. Missing authentication returns 401 Unauthorized'
    );

    // 4. Test Member Login & Block from Manager-Only Endpoint (403)
    const memberLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'elena.rostova@busyinfotech.com',
        password: 'Password123!'
      })
    });
    const memberLoginData = await memberLoginRes.json();
    const memberCookie = memberLoginRes.headers.get('set-cookie');
    const memberTokenMatch = memberCookie?.match(/token=([^;]+)/);
    const memberToken = memberTokenMatch ? memberTokenMatch[1] : '';

    const memberManagerAccessRes = await fetch(`${baseUrl}/api/auth/manager-only-test`, {
      headers: {
        Cookie: `token=${memberToken}`
      }
    });
    const memberManagerAccessData = await memberManagerAccessRes.json();

    assert(
      memberLoginData.user.role === 'MEMBER' &&
      memberManagerAccessRes.status === 403 &&
      memberManagerAccessData.error === 'Access denied: Manager role required',
      '4. Member is blocked from manager-only endpoint with 403 Forbidden'
    );

    // 5. Test Manager Allowed Through Manager-Only Endpoint (200)
    const managerAccessRes = await fetch(`${baseUrl}/api/auth/manager-only-test`, {
      headers: {
        Cookie: `token=${managerToken}`
      }
    });
    const managerAccessData = await managerAccessRes.json();

    assert(
      managerAccessRes.status === 200 &&
      managerAccessData.message === 'Manager access verified' &&
      managerAccessData.user.role === 'MANAGER',
      '5. Manager is allowed through manager-only endpoint with 200 OK'
    );

    // 6. Test GET /api/auth/me for authenticated user
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: {
        Cookie: `token=${managerToken}`
      }
    });
    const meData = await meRes.json();

    assert(
      meRes.status === 200 &&
      meData.user &&
      meData.user.email === 'shivam.sen@busyinfotech.com',
      '6. GET /api/auth/me returns current authenticated user profile'
    );

    // 7. Test POST /api/auth/logout
    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        Cookie: `token=${managerToken}`
      }
    });
    const logoutCookie = logoutRes.headers.get('set-cookie');

    assert(
      logoutRes.status === 200 &&
      logoutCookie &&
      (logoutCookie.includes('token=;') || logoutCookie.includes('Expires=')),
      '7. POST /api/auth/logout clears auth cookie'
    );

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log(`\n=== Test Summary: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
