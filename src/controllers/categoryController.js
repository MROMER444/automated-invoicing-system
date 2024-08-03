const express = require("express");
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require("jsonwebtoken");
const Joi = require("joi");

const AuthCheck = require("../auth/user_auth");

router.post('/v1/create-category', async (req, res) => {
    try {
        const { error } = categoryValidation(req.body);
        if (error) {
            return res.status(400).json({ 'error': error.details[0].message });
        }
        let { name, description } = req.body;
        let existingCategory = await prisma.category.findFirst({
            where: { name: name }
        });
        if (existingCategory) {
            return res.status(400).json({ message: 'Category already exists' });
        }
        const newCategory = await prisma.category.create({
            data: {
                name,
                description,
            },
        });
        if (!newCategory) {
            return res.status(400).json({ message: 'Category cannot be created' });
        }
        return res.status(201).json({ message: 'Category created successfully', category: newCategory });

    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});

router.put('/v1/update-category/:id' , async(req , res) => {
    try {
        const { error } = categoryValidation(req.body);
        if(error){
            return res.status(400).json({ 'error': error.details[0].message });
        }
        let { id }  = req.params;
        id = parseInt(id)

        if(isNaN(id)){
            return res.status(404).json({message : "you have to set an id for the category"})
        };
        let { name, description } = req.body;
        
    
        let existingCategory = await prisma.category.findUnique({
            where : {id : id},
        });
        if(!existingCategory){
            return res.status(404).json({message : `category with this id ${id} not found to update`})
        };
        const updatedCategory = await prisma.category.update({
            where : {id : existingCategory.id},
            data : {
                    name: name,
                    description: description,
            }
        });
        if(updatedCategory){
            return res.status(200).json({ message: 'Product updated successfully', product: updatedCategory });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }

});

router.get('/v1/get-categories', AuthCheck , async (req, res) => {
    try {
        const token = req.headers['x-auth-token'];
        if(!token){
            return res.status(404).json({message: 'there is no token!'});
        }
        const decodeToken = jwt.decode(token);
        console.log(decodeToken.id);
        let category = await prisma.category.findMany();
        if (category.length === 0) {
            return res.status(200).json({ message: 'There are no category' });
        } else {
            return res.status(200).json({ categories: category });
            
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});


router.delete('/v1/delete-categories/:id' , async (req , res) => {
    try {
        const { id } = req.params;
        const categoryId = parseInt(id);
        if(isNaN(id)){
            return res.status(404).json({message : "you have to set an id for the category"})
        };

        let existingcategory = await prisma.category.findUnique({
            where : {id : categoryId},
        });
        if(!existingcategory){
            return res.status(404).json({message : `category with this id ${id} not found to delete`})
        };
        delete_category = await prisma.category.delete({
            where:{id : categoryId},
        });
        if(!delete_category){
            return res.status(404).json({message : `category with this id ${id} can't be deleted`})
        }
        return res.status(404).json({message : `category deleted`})

    } catch (error) {
        console.log(error);
        res.status(500).send('Server error');
    }
});








function categoryValidation(category) {
    const schema = Joi.object({
        name: Joi.string().min(3).max(30).required(),
        description: Joi.string().min(20).max(250).required(),
    });
    return schema.validate(category);
}

module.exports = router;
