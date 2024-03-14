import db from "../config/dbconfig.js";

const lockRef = db.ref("lock");
const historyRef = db.ref("history");
const detectRef = db.ref("detectHistory");

const createNewDoor = async (req, res) => {
  try {
    const data = {
      led: false,
      buzzer: false,
      relay: false,
    };

    await lockRef.push(data, (err) => {
      if (err) {
        throw new Error("Database Error");
      }
    });

    res.status(200).json({ msg: "door create" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getLockStatus = async (req, res) => {
  const { lockId } = req.user;
  try {
    if (!lockId) {
      throw new Error("There's no lockId for this account");
    }
    const snapshot = await lockRef.child(lockId).once("value");

    if (!snapshot.exists()) {
      throw new Error("Invalid LockId");
    }

    const data = { id: snapshot.key, ...snapshot.val() };

    res.status(200).json({ ...data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const lockDoor = async (req, res) => {
  const { lockId, email } = req.user;
  try {
    /** For checking if there's door lock */
    if (!lockId) {
      throw new Error("There's no lockId for this account");
    }

    const snapshot = await lockRef.child(lockId).once("value");

    if (!snapshot.exists()) {
      throw new Error("Invalid LockId");
    }

    /** For change lock status */
    const lockStatus = { led: false, buzzer: false, relay: false };

    await lockRef.child(lockId).update(lockStatus);

    const newSnapshot = await lockRef.child(lockId).once("value");

    const statusData = { id: newSnapshot.key, ...newSnapshot.val() };

    /** For post lock history */
    const historyData = {
      lockId: newSnapshot.key,
      email: email,
      status: false,
      date: new Date().toISOString(),
    };

    const historySnapshot = await historyRef.push(historyData, (err) => {
      if (err) {
        throw new Error("Database Error");
      }
    });

    const historyResponse = {
      id: historySnapshot.key,
      ...historyData,
    };

    res.status(200).json({ status: statusData, newHistory: historyResponse });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const unlockDoor = async (req, res) => {
  const { lockId, email } = req.user;
  try {
    /** For checking if there's door lock */
    if (!lockId) {
      throw new Error("There's no lockId for this account");
    }
    const snapshot = await lockRef.child(lockId).once("value");

    if (!snapshot.exists()) {
      throw new Error("Invalid LockId");
    }

    /** For change lock status */
    const lockStatus = { led: true, buzzer: true, relay: true };

    await lockRef.child(lockId).update(lockStatus);

    const newSnapshot = await lockRef.child(lockId).once("value");

    const statusData = { id: newSnapshot.key, ...newSnapshot.val() };

    /** For post lock history */
    const historyData = {
      lockId: newSnapshot.key,
      email: email,
      status: true,
      date: new Date().toISOString(),
    };

    const historySnapshot = await historyRef.push(historyData, (err) => {
      if (err) {
        throw new Error("Database Error");
      }
    });

    const historyResponse = {
      id: historySnapshot.key,
      ...historyData,
    };

    res.status(200).json({ status: statusData, newHistory: historyResponse });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getLockHistory = async (req, res) => {
  const { lockId } = req.user;
  try {
    const snapshot = await historyRef
      .orderByChild("lockId")
      .equalTo(lockId)
      .once("value");

    const snapshotValue = snapshot.val();
    let data = [];

    for (const key in snapshotValue) {
      const test = { id: key, ...snapshotValue[key] };
      data.push(test);
    }

    res.status(200).json({ msg: "get History", data: data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getDetectHistory = async (req, res) => {
  const { lockId } = req.user;
  try {
    const snapshot = await detectRef
      .orderByChild("lockId")
      .equalTo(lockId)
      .once("value");

    const snapshotValue = snapshot.val();
    let data = [];

    for (const key in snapshotValue) {
      const test = { id: key, ...snapshotValue[key] };
      data.push(test);
    }

    res.status(200).json({ msg: "get Detect History", data: data });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export {
  createNewDoor,
  getLockStatus,
  lockDoor,
  unlockDoor,
  getLockHistory,
  getDetectHistory,
};
