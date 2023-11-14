import jwt from "jsonwebtoken";
import db from "../config/dbconfig.js";
import bcrypt from "bcrypt";
import validator from "validator";

const userRef = db.ref("user");

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
  const { email, password } = req.body;
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

      const match = await bcrypt.compare(password, snapPassword);

      if (!match) {
        throw new Error("Incorrect password");
      } else {
        const token = generateToken(key);

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

    res.status(200).json({ id: token, email: data.email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const userUpdateDetails = async (req, res) => {
  const { id } = req.user;
  const { lockId } = req.body;
  try {
    if (!lockId) {
      throw new Error("Id not inserted");
    }

    await userRef.child(id).update({ lockId });

    const snapshot = await userRef.child(id).once("value");
    const { email, lockId: newLockID } = snapshot.val();
    const updatedData = {
      id: snapshot.key,
      email,
      lockId: newLockID,
    };

    res.status(200).json({ user: updatedData });
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

    res.status(200).json({ user: updatedData });
  } catch (error) {
    res.status(400).json({ error: "Cannot Get User Data" });
  }
};

export { userLogin, userSignup, userUpdateDetails, userGetDetails, userTest };
