import jwt from "jsonwebtoken";
import db from "../config/dbconfig.js";
import bcrypt from "bcrypt";
import validator from "validator";

const userRef = db.ref("user");
const lockRef = db.ref("lock");

const generateToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET_KEY, { expiresIn: "3d" });
};

const userTest = async (req, res) => {
  const { id } = req.body;
  try {
    const snapshot = await userRef.child(id).once("value");
    res.status(200).json({ msg: "hereee", user: snapshot });
  } catch (error) {
    res.status(400).json({ msg: "erorrr" });
  }
};

const userLogin = async (req, res) => {
  const { email, password, phoneToken } = req.body;
  let isMatch = false;

  try {
    if (!email || !password) {
      throw new Error("All fields must be filled");
    }

    const snapshot = await userRef
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    if (!snapshot.exists()) {
      throw new Error("Email not registered");
    }

    const data = snapshot.val();

    for (const key in data) {
      const snapPassword = data[key].password;
      const snapEmail = data[key].email;
      const snapLock = data[key].lockId;

      const match = await bcrypt.compare(password, snapPassword);

      if (!match) {
        throw new Error("Incorrect password");
      } else {
        const token = generateToken(key);

        /** check if user already input a snaplock */
        if (snapLock) {
          const lockSnapshot = await lockRef.child(snapLock).once("value");

          /** Check if user snaplock exist and there's phone token on body */
          if (lockSnapshot.exists() && phoneToken) {
            const lockSnapshotValue = lockSnapshot.val();

            const user = { email: snapEmail, phoneToken };

            /** This is for adding new user or create new data */
            if (lockSnapshotValue.connectedUser) {
              const connectedUser = [...lockSnapshotValue.connectedUser, user];

              await lockRef
                .child(snapLock)
                .update({ ...lockSnapshotValue, connectedUser });
            } else {
              const connectedUser = [user];

              await lockRef
                .child(snapLock)
                .update({ ...lockSnapshotValue, connectedUser });
            }
          }
        }

        res.status(200).json({
          email,
          token,
        });
      }
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const userSignup = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      throw new Error("All fields must be filled");
    }

    if (!validator.isEmail(email)) {
      throw new Error("Email is not valid");
    }

    if (!validator.isStrongPassword(password)) {
      throw new Error("Password not strong enough");
    }

    /** This is for checkin if email already exist */
    const snapshot = await userRef
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    if (snapshot.exists()) {
      throw new Error("Email already exist");
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const data = {
      email,
      password: hash,
      dateCreated: new Date().toISOString(),
    };

    const pushSnapshot = await userRef.push(data, (err) => {
      if (err) {
        throw new Error("Database Error");
      }
    });

    const id = pushSnapshot.key;
    const token = generateToken(id);

    res.status(200).json({ token, email: data.email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const userLogout = async (req, res) => {
  const { id } = req.user;
  const { phoneToken } = req.body;

  try {
    const userSnapshot = await userRef.child(id).once("value");
    const userValue = userSnapshot.val();

    const lockId = userValue.lockId;

    const user = { email: userValue.email, phoneToken };

    if (lockId) {
      const lockSnapshot = await lockRef.child(lockId).once("value");

      if (lockSnapshot.exists() && phoneToken) {
        const lockSnapshotValue = lockSnapshot.val();

        const lockUser = lockSnapshotValue.connectedUser;

        if (lockUser) {
          const afterDeletedUser = lockUser.filter((val) => {
            return (
              val.email !== user.email || val.phoneToken !== user.phoneToken
            );
          });

          /** update new old lock user data */
          await lockRef
            .child(lockId)
            .update({ ...lockSnapshotValue, connectedUser: afterDeletedUser });
        }
      }
    }

    res.status(200).json({ msg: "OK" });
  } catch (error) {
    res.status(400).json({ error: "KO" });
  }
};

const userUpdateDetails = async (req, res) => {
  const { id } = req.user;
  const { lockId, phoneToken } = req.body;
  try {
    if (!lockId) {
      throw new Error("Id not inserted");
    }

    /** Get user by jwt */
    const userSnapshot = await userRef.child(id).once("value");
    const userValue = userSnapshot.val();

    const user = {
      email: userValue.email,
      phoneToken,
    };

    /** Check if user already have lockId */
    if (userValue.lockId) {
      /** get the old LockId by user lockId */
      const oldLockSnapshot = await lockRef
        .child(userValue.lockId)
        .once("value");

      /** Check if the old lockId exist */
      if (oldLockSnapshot.exists() && phoneToken) {
        const oldLockValue = oldLockSnapshot.val();

        const oldLockUser = oldLockValue.connectedUser;

        /** Check if old connected user is exist, then remove user if email and phoneToken is same */
        if (oldLockUser) {
          const afterDeletedUser = oldLockUser.filter((val) => {
            return (
              val.email !== user.email || val.phoneToken !== user.phoneToken
            );
          });

          /** update new old lock user data */
          await lockRef
            .child(userValue.lockId)
            .update({ ...oldLockValue, connectedUser: afterDeletedUser });
        }
      }
    }

    /** get lock data using user lockId input */
    const newLockSnapshot = await lockRef.child(lockId).once("value");

    /** Check if lock data is exist */
    if (newLockSnapshot.exists() && phoneToken) {
      const newLockValue = newLockSnapshot.val();

      /** This is for adding new user or create new data to that lock */
      if (newLockValue.connectedUser) {
        const connectedUser = [...newLockValue.connectedUser, user];

        await lockRef.child(lockId).update({ ...newLockValue, connectedUser });
      } else {
        const connectedUser = [user];

        await lockRef.child(lockId).update({ ...newLockValue, connectedUser });
      }
    }

    await userRef.child(id).update({ lockId });

    const snapshot = await userRef.child(id).once("value");
    const { email, lockId: newLockID } = snapshot.val();
    const updatedData = {
      id: snapshot.key,
      email,
      lockId: newLockID,
    };

    res.status(200).json({ ...updatedData });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const userGetDetails = async (req, res) => {
  const { id } = req.user;
  try {
    const snapshot = await userRef.child(id).once("value");
    const { email, lockId: newLockID } = snapshot.val();
    const updatedData = {
      id: snapshot.key,
      email,
      lockId: newLockID,
    };

    res.status(200).json({ ...updatedData });
  } catch (error) {
    res.status(400).json({ error: "Cannot Get User Data" });
  }
};

export {
  userLogin,
  userSignup,
  userUpdateDetails,
  userGetDetails,
  userLogout,
  userTest,
};
