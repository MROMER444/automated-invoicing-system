const express = require("express");
const router = express.Router();
const Joi = require("joi");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

dotenv.config({ path: ".env" });
const JWT_SECRET = process.env.JWT_SECRET;

router.post("/v1/create-user", async (req, res) => {
  try {
    const { error } = userValidation(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    const { name, email, password } = req.body;
    let user = await prisma.user.findFirst({ where: { email } });
    if (user) {
      return res.status(404).json({ error: "User already registered!" });
    }
    user = await prisma.User.create({
      data: { name, email, password: bcrypt.hashSync(password, 10) },
    });
    const token = jwt.sign({ id: user.id }, JWT_SECRET);

    if (!user) {
      return res.status(404).json({ error: "Failed to create User" });
    } else {
      return res
        .status(201)
        .json({ records: { user: user, Token: { token } }, success: true });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Internal Server Error" });
  }
});

function userValidation(user) {
  const schema = {
    name: Joi.string().min(3).max(20).required(),
    email: Joi.string().min(3).max(20).required(),
    password: Joi.string().min(8).required(),
  };
  return Joi.validate(user, schema);
}

module.exports = router;
