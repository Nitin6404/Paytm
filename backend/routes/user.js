const express = require('express');
const { User } = require('../db');
const zod = require('zod');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config');
const authMiddleware = require('../middleware');
const router = express.Router();

const signupBody = zod.object({
    username: zod.string().email(),
    password: zod.string(),
    firstName: zod.string(),
    lastName: zod.string()
});

const signinBody = zod.object({
    username: zod.string().email(),
    password: zod.string()
})

const updateData = zod.object({
    password: zod.string().min(4).optional(),
    firstName: zod.string().optional(),
	lastName: zod.string().optional()
})


router.post("/signup", async (req, res) => {
    const { success } = signupBody.safeParse(req.body);
    if(!success){
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        });
    }

    const existedUser = await User.findOne({
        username: req.body.username
    })

    if(existedUser){
        return res.status(411).json({
            message: "Username already taken"
        });
    }

    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName
    })

    const userId = user._id;

    const token = jwt.sign({
        userId
    }, JWT_SECRET)

    res.status(200).json({
        message: "User Created Successfully!!!!!",
        token: token
    })
})

router.post("signin", async (req, res) => {
    const { success } = signinBody.safeParse(req.body);
    if(!success){
        return res.status(411).json({
            message: "Error while logging in due to Invalid Inputs"
        });
    }

    const existedUser = await User.findOne({
        username: req.username
    });

    if(!existedUser){
        return res.status(411).json({
            message: "User not found"
        })
    }

    const userId = existedUser._id;

    const token = jwt.sign({
        userId
    }, JWT_SECRET)

    res.status(200).json({
        token
    })

})

router.put("/", authMiddleware, async (req, res) => {
    const { success } = updateData.safeParse(req.body);

    if(!success){
        return res.status(411).json({
            message: "Error while updating information"
        })
    }

    try{
        await User.updateOne({_id: req.userId}, req.body);

        res.status(200).json({
            message: "Updated successfully"
        });
    }catch(e){
        console.error(e);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.status(200).json({
        user: users.map(user => ({
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

module.exports = {
    router
};