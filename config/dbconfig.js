import admin from "firebase-admin";
import ServiceAccount from "../firebase.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(ServiceAccount),
  databaseURL:
    "https://smart-door-lock-58-default-rtdb.asia-southeast1.firebasedatabase.app",
});

const db = admin.database();

export default db;
