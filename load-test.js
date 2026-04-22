import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const loginSuccessRate = new Rate('login_success');
const dashboardLoadRate = new Rate('dashboard_load_success');
const vitalsSubmitRate = new Rate('vitals_submit_success');

const BASE_URL = 'http://localhost:3000';

export const options = {
  stages: [
    { duration: '2m', target: 10 }, // Ramp up to 10 users
    { duration: '5m', target: 10 }, // Stay at 10 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'], // Error rate under 10%
    errors: ['rate<0.1'],
    login_success: ['rate>0.95'],
    dashboard_load_rate: ['rate>0.9'],
    vitals_submit_rate: ['rate>0.95'],
  },
};

export function setup() {
  console.log('Starting VitalsEdge load test...');
}

export default function () {
  const testUser = `user${Math.floor(Math.random() * 1000)}@test.com`;
  
  // Test authentication flow
  const authResponse = testAuthentication(testUser);
  
  if (authResponse && authResponse.token) {
    // Test dashboard loading
    testDashboardLoad(authResponse.token);
    
    // Test vitals submission
    testVitalsSubmission(authResponse.token);
    
    // Test patient data retrieval
    testPatientDataRetrieval(authResponse.token);
    
    // Test data export
    testDataExport(authResponse.token);
  }
  
  sleep(1);
}

function testAuthentication(email) {
  const authPayload = JSON.stringify({
    email: email,
    password: 'testpassword123',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.post(`${BASE_URL}/api/auth/login`, authPayload, params);
  
  const success = check(response, {
    'auth status is 200': (r) => r.status === 200,
    'auth response time < 500ms': (r) => r.timings.duration < 500,
    'auth returns token': (r) => r.json('token') !== undefined,
  });
  
  loginSuccessRate.add(success);
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
  
  if (success) {
    return {
      token: response.json('token'),
      userId: response.json('userId'),
    };
  }
  
  return null;
}

function testDashboardLoad(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.get(`${BASE_URL}/api/dashboard`, params);
  
  const success = check(response, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard load time < 1s': (r) => r.timings.duration < 1000,
    'dashboard returns patient data': (r) => r.json('patients').length >= 0,
  });
  
  dashboardLoadRate.add(success);
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testVitalsSubmission(token) {
  const vitalsPayload = JSON.stringify({
    patientId: `patient-${Math.floor(Math.random() * 100)}`,
    heartRate: 70 + Math.floor(Math.random() * 20),
    bloodPressure: {
      systolic: 110 + Math.floor(Math.random() * 30),
      diastolic: 70 + Math.floor(Math.random() * 20),
    },
    oxygenSaturation: 95 + Math.floor(Math.random() * 5),
    temperature: 36.5 + Math.random() * 2,
    timestamp: new Date().toISOString(),
  });
  
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.post(`${BASE_URL}/api/vitals`, vitalsPayload, params);
  
  const success = check(response, {
    'vitals status is 200': (r) => r.status === 200,
    'vitals submission time < 500ms': (r) => r.timings.duration < 500,
    'vitals accepted': (r) => r.json('success') === true,
  });
  
  vitalsSubmitRate.add(success);
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testPatientDataRetrieval(token) {
  const patientId = `patient-${Math.floor(Math.random() * 100)}`;
  
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.get(`${BASE_URL}/api/patients/${patientId}`, params);
  
  const success = check(response, {
    'patient retrieval status is 200 or 404': (r) => r.status === 200 || r.status === 404,
    'patient retrieval time < 300ms': (r) => r.timings.duration < 300,
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

function testDataExport(token) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  
  const response = http.get(`${BASE_URL}/api/export/patients?format=csv`, params);
  
  const success = check(response, {
    'export status is 200': (r) => r.status === 200,
    'export time < 2s': (r) => r.timings.duration < 2000,
    'export returns CSV': (r) => r.headers['Content-Type'].includes('text/csv'),
  });
  
  errorRate.add(!success);
  responseTime.add(response.timings.duration);
}

export function teardown() {
  console.log('Load test completed');
  console.log(`Error rate: ${errorRate.rate * 100}%`);
  console.log(`Average response time: ${responseTime.avg}ms`);
  console.log(`Login success rate: ${loginSuccessRate.rate * 100}%`);
  console.log(`Dashboard load success rate: ${dashboardLoadRate.rate * 100}%`);
  console.log(`Vitals submit success rate: ${vitalsSubmitRate.rate * 100}%`);
}
