import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

import { env } from '../../config/env.js';
import type { FirebaseIdentity } from './types.js';

const adminAppName = 'grama360-api';

function getFirebaseAdminAuth() {
  if (!env.FIREBASE_PROJECT_ID) {
    throw new Error('FIREBASE_PROJECT_ID must be configured for token verification.');
  }

  const app =
    getApps().find((candidate) => candidate.name === adminAppName) ??
    initializeApp(
      {
        credential: applicationDefault(),
        projectId: env.FIREBASE_PROJECT_ID,
      },
      adminAppName,
    );

  return getAuth(app);
}

function toFirebaseIdentity(decoded: DecodedIdToken): FirebaseIdentity {
  return {
    uid: decoded.uid,
    phoneNumber: decoded.phone_number ?? null,
    signInProvider: decoded.firebase.sign_in_provider ?? null,
    signInSecondFactor: decoded.firebase.sign_in_second_factor ?? null,
    authTime: decoded.auth_time,
  };
}

export async function verifyFirebaseIdToken(token: string): Promise<FirebaseIdentity> {
  const decoded = await getFirebaseAdminAuth().verifyIdToken(token);
  return toFirebaseIdentity(decoded);
}
