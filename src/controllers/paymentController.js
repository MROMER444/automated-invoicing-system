const express = require("express");
const router = express.Router();
const Joi = require("joi");
const { PrismaClient, Role } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");



router.post('/v1/connect-payment' , async (req , res) => {
    try {
        const { error } = paymmentvalidation(req.body);
    if(error){
        res.status(404).json({ "error": error.details[0].message });
        return;
    }
    const token = req.headers['x-auth-token'];
    if(!token){
        return res.status(404).json({message: 'there is no token!'});
    }
    const decodeToken = jwt.decode(token);

    existingpayment = await prisma.payment.findFirst({
        where : {userId : decodeToken.id}
    });
    if(!existingpayment){
        const { paymentMethod ,  amount } = req.body;
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }
        const newpayment = await prisma.payment.create({
            data: {
                paymentMethod,
                amount : parseFloat(amount),
                userId : decodeToken.id
            }
        });
        if(!newpayment){
            return res.status(400).json({message : "can't create payment"});
        }
        return res.status(201).json({"payment" : newpayment});
    }
    return res.status(400).json({message : "you already has a payment profile"})
    } catch (error) {
        console.log(error);
        return res.status(500).send('Server error');

    }
});


router.get('/v1/get-all-payment' , async (req , res) => {
    try {
        payment = await prisma.payment.findMany();
        if(payment.length === 0){
            return res.status(404).json({payments : []})
        }
        return res.status(404).json({payments : payment})
    } catch (error) {
        return res.status(500).send('Server error');
    }
});


router.get('/v1/get-paymentById/:id', async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'No token provided!' });
        }

        const decodeToken = jwt.decode(token);
        if (!decodeToken || !decodeToken.id) {
            return res.status(401).json({ message: 'Invalid token!' });
        }

        const payment = await prisma.payment.findFirst({
            where: { userId: decodeToken.id }
        });

        if (!payment) {
            return res.status(200).json({ "payment": [] });
        }

        return res.status(200).json({ "payment": payment });

    } catch (error) {
        console.log(error);
        return res.status(500).send('Server error');
    }
});


router.delete('/v1/delete-payment/:id', async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if (!token) {
            return res.status(401).json({ message: 'No token provided!' });
        }

        const decodeToken = jwt.decode(token);
        if (!decodeToken || !decodeToken.id) {
            return res.status(401).json({ message: 'Invalid token!' });
        }

        const payment = await prisma.payment.findFirst({
            where: { userId: decodeToken.id }
        });

        if (!payment) {
            return res.status(404).json({ message: 'There is no payment profile to delete!' });
        }

        await prisma.payment.delete({
            where: { id: payment.id }
        });

        return res.status(200).json({ message: 'Payment profile deleted successfully!' });

    } catch (error) {
        console.log(error);
        return res.status(500).send('Server error');
    }
});




function paymmentvalidation(payment) {
    const schema = Joi.object({
        paymentMethod: Joi.valid('MasterCard' , 'VisaCard').required(),
        amount: Joi.number().required(),
    });
    return schema.validate(payment);
}

module.exports = router;