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
            res.status(400).json({message : "can't create payment"});
        }
        res.status(201).json({"payment" : newpayment});
    }
    res.status(400).json({message : "you already has a payment profile"})
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');

    }
});






router.get('/v1/get-all-payment' , async (req , res) => {
    try {
        payment = await prisma.payment.findMany();
        if(payment.length === 0){
            res.status(404).json({payments : []})
        }
        res.status(404).json({payments : payment})
    } catch (error) {
        res.status(500).send('Server error');
    }
})
















function paymmentvalidation(payment) {
    const schema = Joi.object({
        paymentMethod: Joi.valid('MasterCard' , 'VisaCard').required(),
        amount: Joi.number().required(),
    });
    return schema.validate(payment);
}

module.exports = router;