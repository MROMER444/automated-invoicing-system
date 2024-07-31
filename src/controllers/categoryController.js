const express = require("express");
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Joi = require("joi");















function vategoryValidation(category) {
    const schema = {
        name: Joi.string().min(3).max(30).required(),
        description: Joi.string().min(20).max(250).required(),
    }
    return Joi.validate(category, schema);
}

module.exports = router;