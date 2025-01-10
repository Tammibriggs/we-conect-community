import jwt from "jsonwebtoken";

function generateAccessToken(id, expiry) {
  return jwt.sign({ id }, process.env.SECRET_TOKEN, {
    expiresIn: expiry || "1h",
  });
}

async function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(" ")[1];
    return jwt.verify(token, process.env.SECRET_TOKEN, async (err, user) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return {
            isError: true,
            expired: true,
            message: "Your session has expired",
          };
        } else return { isError: true, message: "Token is invalid" };
      }
      req.userId = user.id;
      return { isError: false, user };
    });
  } else {
    return { isError: true, message: "You are not authenticated!" };
  }
}

export { generateAccessToken, verifyToken };
