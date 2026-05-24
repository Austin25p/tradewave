import { initializeFirestore, FirestoreSettings } from 'firebase/firestore';

// Just to test the signature
const test = (app: any, settings: FirestoreSettings, dbName?: string) => {
  return initializeFirestore(app, settings, dbName);
};
