import type { FirebaseIdentity } from '../modules/auth/types.js';

declare global {
  namespace Express {
    interface Request {
      firebaseIdentity?: FirebaseIdentity;
    }
  }
}

export {};
