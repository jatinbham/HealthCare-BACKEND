import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'

import User from './models/User.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

// Debug (important)
console.log("Mongo URL:", process.env.MONGO_URL)

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected"))
.catch(err => {
    console.log("❌ MongoDB Connection Error:")
    console.log(err)
})

app.get('/', (req, res) => {
    res.send('Backend Running 🚀')
})

app.post('/signup', async (req, res) => {

    try {

        console.log("Request Body:", req.body)

        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields required" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        })

        res.json(user)

    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})



// server start
app.listen(5000, () => {
    console.log("Server running on port 5000 🚀")
})
