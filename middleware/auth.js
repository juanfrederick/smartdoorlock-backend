import jwt from "jsonwebtoken";
import db from "../config/dbconfig.js";

const userRef = db.ref("user");

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  const token = authorization.split(" ")[1];

  try {
    const { _id } = jwt.verify(token, process.env.SECRET_KEY);
    const snapshot = await userRef.child(_id).once("value");

    if (snapshot.exists()) {
      const data = { id: snapshot.key, ...snapshot.val() };
      req.user = data;
      next();
    } else {
      throw Error();
    }
  } catch (error) {
    res.status(401).json({ error: "Request is not authorized" });
  }
};

export default requireAuth;
