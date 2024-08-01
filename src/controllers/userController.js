const express = require("express");
const router = express.Router();
const Joi = require("joi");
const jwt = require("jsonwebtoken") ;
const { PrismaClient, Role } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

dotenv.config({ path: '.env' });
const JWT_SECRET = process.env.JWT_SECRET;



router.post('/v1/signup', async (req, res) => {
    try {
        const { error } = uservalidation(req.body);
        if (error) {
            res.status(404).json({ "error": error.details[0].message });
            return;
        }

        let user = await prisma.user.findFirst({ where: { email: req.body.email } });
        if (user) {
            res.status(404).json({ "error": "User already registered!" });
            return;
        }

        const { name, password, email, address } = req.body;
        user = await prisma.user.create({ data: { name, email, address, password: bcrypt.hashSync(password, 10) } });
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
        res.status(201).json({ "records": { "user": user, "token": { token } } });
    } catch (error) {
        console.log(error);
        res.status(500).json({ "msg": "Internal Server Error" });
    }
});

router.post('/v1/login', async (req, res) => {
    try {
        const { error } = loginvalidation(req.body);
        if (error) {
            return res.status(404).json({ error: error.details[0].message });
        }
        const { email, password } = req.body;
        let user = await prisma.user.findFirst({ where: { email: email } });
        if (!user) {
            return res.status(404).json({ "msg": { "Invalid name or password": { "success": false } } });
        }
        const passwordMatch = bcrypt.compareSync(password, user.password); 
        if (!passwordMatch) {
            return res.status(404).json({ "msg": { "Invalid email or password!": { "success": false } } });
        }
        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET);
        res.header('Authorization', 'Bearer ' + token);
        res.status(200).json({ "token": token, "success": true });
    } catch (error) {
        console.log(error);
        res.status(400).json({ "msg": "Internal Server Error" });
    }
});

function loginvalidation(user) {
    const schema = {
        email: Joi.string().required().email(), 
        password: Joi.string().required()
    };
    return Joi.validate(user, schema);
}

function uservalidation(user) {
    const schema = {
        name: Joi.string().min(3).max(20),
        password: Joi.string().required(),
        email: Joi.string().required().email(),
        address: Joi.string().required()
    };
    return Joi.validate(user, schema);
}

module.exports = router; 
