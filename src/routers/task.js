const express = require('express')
const Task = require('../models/task')
const { update } = require('../models/user')
const auth = require('../middleware/auth')
const router = new express.Router()

router.post('/tasks', auth ,async (req, res) => {
    // const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(400).send(error)
    }

    // const task = new Task(req.body)
    // task.save()
    //     .then( () => {
    //         res.status(201).send({
    //             message:"task created",
    //             task
    //         })
    //     })
    //     .catch( (error) => {
    //         res.status(400).send(error)
    //     })
})

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=10
// GET /tasks?sortBy=createdAt:desc

router.get('/tasks', auth ,async (req, res) => {
    const match = {}
    const sort = {}  
    if(req.query.completed) {
        match = { completed: req.query.completed, owner: req.user._id }
    }

    if(req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        // const tasks = await Task.find(match).populate('owner').sort({updatedAt:-1})
        // res.send(tasks)
        
        // another solution
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
        
    } catch (error) {
        res.status(500).send(error)
    }

    // Task.find()
    //     .then( (tasks) => {
    //         res.send(tasks)
    //     }).catch( (error) => {
    //         res.status(500).send(error)
    //     })
    
    
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id    
    try {
        // const task = await Task.findById(_id)
        const task = await Task.findOne({ _id, owner: req.user._id }).populate('owner')
        if(!task){
            return res.status(404).send()    
        }
        res.send(task)
    } catch (error) {
        res.status(500).send()
    }
    
    // Task.findById(_id)
    //     .then( (task) => {
    //         if(!task){
    //             return res.status(404).send()
    //         }
    //         res.send(task)
    //     }).catch( (error) => {
    //         res.status(500).send(error)
    //     })
})



router.patch('/tasks/:id', auth,async (req,res) => {
    const _id = req.params.id
    
    const updates = Object.keys(req.body)
    const allowedUpdates = ['desc', 'completed']
    const isValid = updates.every((update) => allowedUpdates.includes(update))
    if(!isValid){
        res.status(400).send({error: 'Invalid Update'})
    }

    try {
        // const task = await Task.findById(_id)
        const task = await Task.findOne({_id:req.params.id, owner: req.user._id})
        //const task = await Task.findByIdAndUpdate(_id, req.body, {new:true, runValidators:true})
        const count = await Task.countDocuments({ owner: req.user._id })
        if(!task){
            res.status(404).send()
        }
        updates.forEach((update) => task[update] = req.body[update])
        await task.save()
        res.send({
            task,
            count
        })    
    } catch (error) {
        res.status(400).send(error)
    }
})

router.delete('/tasks/:id', auth , async (req,res) => {
    const _id = req.params.id 
    try {
        // const task = await Task.findByIdAndDelete(_id)
        const task = await Task.findOneAndDelete({_id: req.params.id , owner:req.user._id})
        if(!task){
            res.status(404).send()
        }
        res.send('Task Deleted') 
    } catch (error) {
        res.status(500).send(error)
    }
    // Task.findByIdAndDelete(_id)
    //     .then( (task) => {
    //         if(!task){
    //             return res.status(404).send()
    //         }
    //         res.send('task is deleted')
    //         return Task.countDocuments({})
    //     })
    //     .then( (result) => {
    //         console.log(result)
    //     })
    //     .catch( (error) => {
    //         res.send(error)
    //     })
    
})

module.exports = router






















