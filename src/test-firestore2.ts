import { getFirestore, initializeFirestore } from "firebase/firestore";

const app: any = null;
const db1 = getFirestore(app, "auth");
const db2 = initializeFirestore(app, { experimentalForceLongPolling: true }, "auth");
