// Shared helper for Scenario Mode API routes. Uses the same JWT-based
// Firestore REST pattern as /api/pro-lesson — kept separate from the
// Firebase Admin SDK (server-init.ts) which is used by other routes.

export function createScenarioJWT(): string {
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: clientEmail, sub: clientEmail,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/datastore',
  })).toString('base64url');
  const signingInput = `${header}.${payload}`;
  const sign = require('crypto').createSign('RSA-SHA256');
  sign.update(signingInput);
  const signature = sign.sign(privateKey, 'base64url');
  return `${signingInput}.${signature}`;
}

export async function getScenarioFirebaseToken(): Promise<string> {
  const jwt = createScenarioJWT();
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const data = await res.json();
  return data.access_token;
}

export function scenarioFirestoreBaseUrl(): string {
  const projectId = process.env.FIREBASE_PROJECT_ID!;
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}
