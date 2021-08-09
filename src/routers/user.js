const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const { Error } = require('mongoose')
const sharp = require('sharp')
const { sendWelcomeEmail, sendCancelEmail } = require('../emails/account')

const router = new express.Router()

router.post('/users', async (req, res) => {
    const user = new User(req.body)
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({
            user,
            token
        })    
    } catch (error) {
        res.status(400).send(error)
    }

    // user.save()
    //     .then( () => {
    //         res.send({
    //             message:"user created",
    //             data: user,
    //         })
    //     })
    //     .catch( (error) => {
    //         res.status(400).send(error)
    //     })
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({
            user,
            token
        })
    } catch (error) {
        res.status(400).send()
    }
})

router.post('/users/logout',auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token 
        })
        await req.user.save()
        res.send('Logout!!')
    } catch (error) {
        res.status(500).send()
    }
})
router.post('/users/logoutAll',auth, async (req, res) => {
    try {
        req.user.tokens = []
        await me.save()
        res.send('Logout!!')
    } catch (error) {
        res.status(500).send()
    }
})

router.get('/users', auth, async (req, res) => {
    try {
        const users = await User.find()
        res.send(users)
    } catch (error) {
        res.status(500).send()
    }

    // User.find()
    //     .then( (users) => {
    //         res.send(users)
    //     }).catch( (error) => {
    //         res.status(500).send(error)
    //     })
    
    
})
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.get('/users/:id', async (req, res) => {
    const _id = req.params.id    
    try {
        const user = await User.findById(_id)
        if(!user){
            return res.status(404).send()    
        }
        res.send(user)
    } catch (error) {
        res.status(500).send()
    }

    // User.findById(_id)
    //     .then( (user) => {
    //         if(!user){
    //             return res.status(404).send()
    //         }
    //         res.send(user)
    //     }).catch( (error) => {
    //         res.status(500).send(error)
    //     })
})

router.patch('/users/:id/d', async (req,res) => {
    const _id = req.params.id
    
    // to update only the list items
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValid = updates.every( (update) => allowedUpdates.includes(update) )
    if(!isValid){
        return res.status(400).send({error: 'invaild updates'})
    }
    
    try {
        const user = await User.findByIdAndUpdate( _id)
        updates.forEach((update) => user[update] = req.body[update])
        await user.save()

        // const user = await User.findByIdAndUpdate( _id,req.body,{new:true, runValidators:true}) --> this in pre hook does not work
        const count = await User.countDocuments({})
        
        
        if(!user){
            return res.status(404).send()
        }
        res.send({
            user,
            count
        })
    } catch (error) {
        res.status(400).send(error)
    }
    
    // User.findByIdAndUpdate( _id,{age:1000})
    //     .then( (user) => {
    //         if(!user){
    //             return res.status(404).send()
    //         }
    //         res.send(user)
    //         return User.countDocuments({})
    //     })
    //     .then( (result) => {
    //         res.send(result)
    //     })
    //     .catch( (error) => {
    //         res.send(error)
    //     })    
})

router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValid = updates.every( (update) => allowedUpdates.includes(update) )
    if(!isValid){
        return res.status(400).send({error: 'invaild updates'})
    }

    try {
        updates.forEach((update) => req.user[update] = req.body[update])
        await req.user.save()
        res.send({
            message:"User Updated",
            user: req.user
        })
    } catch (error) {
        res.status(400).send(error)
    }
})

// router.delete('/users/:id', auth, async (req,res) => {
//     const _id = req.params.id 
//     try {
//         const user = await User.findOneAndDelete(_id)
//         if(!user){
//             res.status(404).send()
//         }
//         res.send('User Deleted') 
//     } catch (error) {
//         res.status(500).send(error)
//     }
// })

router.delete('/users/me', auth, async (req,res) => { 
    try {
        
        await req.user.remove()
        sendCancelEmail(req.user.email, req.user.name)
        res.send({
            message: "User Deleted!",
            user:req.user,
        }) 
    } catch (error) {
        res.status(500).send(error)
    }
})

upload = multer({
    limits: {
        fileSize: 1000000,
    },
    fileFilter(req, file, cb){
        if( !file.originalname.match( /\.(png|jpg|jepg)$/ ) ) {
            cb(new Error('Please Upload a pic !!'))    
        }
        cb(undefined,true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req,res) => {
    // req.user.avatar = req.file.buffer
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send()
}, (error,req,res,next) => {
    res.status(404).send({error: error.message})
})

router.delete('/users/me/avatar', auth, async (req,res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get('/users/:id/avatar', async (req,res) => {
    try {
        const user = await User.findById(req.params.id)
        if (!user || !user.avatar) {
            throw new Error()
        }
        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (error) {
        res.status(404).send()
    }
})

module.exports = router






















