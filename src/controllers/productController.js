const express = require("express");
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const Joi = require('joi');

//Note
router.post('/v1/create-product', async (req, res) => {
    try {
    const { error } = productValidation(req.body);
    if (error) {
        return res.status(400).json({ 'error': error.details[0].message });
    }
    let { name, description, price, stock, categoryId } = req.body;
    categoryId = parseInt(categoryId);
    stock = parseInt(stock);
    price = parseFloat(price);

    
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });
        if (!category) {
            return res.status(400).json({ message: 'Invalid category ID' });
        }

        let existingProduct = await prisma.product.findFirst({
            where: { name: name },
        });
        if (existingProduct) {
            const updatedProduct = await prisma.product.update({
                where: { id: existingProduct.id },
                data: {
                    stock: existingProduct.stock + stock,
                    updatedAt: new Date(),
                },
            });
            return res.status(200).json({ message: 'Product stock updated successfully', product: updatedProduct });
        } else {
            const newProduct = await prisma.product.create({
                data: {
                    name,
                    description,
                    price,
                    stock,
                    categoryId,
                },
            });
            return res.status(201).json({ message: 'Product created successfully', product: newProduct });
        }

    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});


router.put('/v1/update-product/:id' , async(req , res) => {
    try {
        const { error } = productValidation(req.body);
        if(error){
            return res.status(400).json({ 'error': error.details[0].message });
        }
        let { id }  = req.params;
        id = parseInt(id)

        if(isNaN(id)){
            return res.status(404).json({message : "you have to set an id for the product"})
        };
        let { name, description, price, stock, categoryId } = req.body;
        categoryId = parseInt(categoryId);
        stock = parseInt(stock);
        price = parseFloat(price);
        
    
        let existingProduct = await prisma.product.findUnique({
            where : {id : id},
        });
        if(!existingProduct){
            return res.status(404).json({message : `Product with this id ${id} not found to update`})
        };
        const updatedProduct = await prisma.product.update({
            where : {id : existingProduct.id},
            data : {
                    name: name,
                    description: description,
                    price: price,
                    stock: stock,
                    categoryId: categoryId,
            }
        });
        if(updatedProduct){
            return res.status(200).json({ message: 'Product updated successfully', product: updatedProduct });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }

});


router.get('/v1/get-products', async (req, res) => {
    try {
        let products = await prisma.product.findMany();
        if (products.length === 0) {
            return res.status(200).json({ message: 'There are no products' });
        } else {
            return res.status(200).json({ products: products });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});


router.delete('/v1/delete-product/:id' , async (req , res) => {
    try {
        const { id } = req.params;
        const productId = parseInt(id);
        if(isNaN(id)){
            return res.status(404).json({message : "you have to set an id for the product"})
        };

        let existingProduct = await prisma.product.findUnique({
            where : {id : productId},
        });
        if(!existingProduct){
            return res.status(404).json({message : `Product with this id ${id} not found to delete`})
        };
        delete_product = await prisma.product.delete({
            where:{id : productId},
        });
        if(!delete_product){
            return res.status(404).json({message : `Product with this id ${id} can't be deleted`})
        }
        return res.status(404).json({message : `Product deleted`})

    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});



function productValidation(product) {
    const schema = {
        name: Joi.string().min(3).max(30).required(),
        description: Joi.string().min(20).max(250).required(),
        price: Joi.number().required(),
        stock: Joi.number().required(),
        categoryId: Joi.number().required(),
    }
    return Joi.validate(product, schema);
}

module.exports = router;