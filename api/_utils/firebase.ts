import admin from "firebase-admin";

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Vercel Function: Firebase Admin initialized with service account.");
    } catch (error) {
      console.error("Vercel Function: Failed to parse FIREBASE_SERVICE_ACCOUNT:", error);
    }
  } else {
    console.warn("Vercel Function: FIREBASE_SERVICE_ACCOUNT is missing.");
    try {
      admin.initializeApp();
    } catch (e) {}
  }
}

export const db = admin.firestore();
