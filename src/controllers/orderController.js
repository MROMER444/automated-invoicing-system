const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { PrismaClient, Role } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");




router.post('/v1/create-order' , async (req , res) => {
    try {
        
    } catch (error) {
        
    }
})