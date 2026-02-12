import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD76Gs5vN1oSrp0apfpUngdTyReBBX2WYc",
  authDomain: "nukko-tienda-9efa0.firebaseapp.com",
  projectId: "nukko-tienda-9efa0",
  storageBucket: "nukko-tienda-9efa0.firebasestorage.app",
  messagingSenderId: "391269379838",
  appId: "1:391269379838:web:59456763ae0a24ec943faf",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
