const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");

dotenv.config({ path: ".env" });
const JWT_SECRET = process.env.JWT_SECRET;

let tokenBlacklist = [];

const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token || tokenBlacklist.includes(token)) {
    return res.sendStatus(403);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

router.post("/v1/login", async (req, res) => {
  try {
    const { error } = loginValidation(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password } = req.body;
    const user = await prisma.user.findFirst({ where: { email: email } });
    if (!user) {
      return res
        .status(404)
        .json({ msg: { "Invalid email or password": { success: false } } });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);
    if (!passwordMatch) {
      return res
        .status(404)
        .json({ msg: { "Invalid email or password!": { success: false } } });
    }

    const token = jwt.sign({ id: user.id }, JWT_SECRET);
    res.header("Authorization", "Bearer " + token);
    res.status(200).json({ success: true, token: token, user: user.name });
  } catch (error) {
    console.log(error);
    res.status(500).json({ msg: "Internal Server Error" });
  }
});

router.post("/v1/logout", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (token) {
    tokenBlacklist.push(token);
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  }

  res.status(400).json({ success: false, message: "Token is required for logout" });
});

function loginValidation(user) {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(user);
}

module.exports = router;
