import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import Groq from "groq-sdk"

import User from "./models/User.js"

dotenv.config()

const app = express()

app.use(cors({ origin: "*" }))
app.use(express.json())

// DB
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected 🚀"))
.catch(err => console.log(err))

// GROQ SETUP
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

// AUTH MIDDLEWARE
const authMiddleware = (req, res, next) => {

    try {

        const token = req.headers.authorization

        if (!token) {
            return res.status(401).json({
                message: "No token provided"
            })
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET)

        req.user = verified

        next()

    } catch (error) {

        res.status(401).json({
            message: "Invalid token"
        })

    }

}

// HOME
app.get("/", (req, res) => {
    res.send("Backend Running 🚀")
})

// SIGNUP
app.post("/signup", async (req, res) => {

    try {

        const { name, email, password } = req.body

        const existingUser = await User.findOne({ email })

        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        await User.create({
            name,
            email,
            password: hashedPassword
        })

        res.json({
            message: "User created"
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

})

// LOGIN
app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({ message: "User not found" })
        }

        const match = await bcrypt.compare(password, user.password)

        if (!match) {
            return res.status(400).json({ message: "Invalid password" })
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.json({
            token,
            user
        })

    } catch (error) {
        res.status(500).json({ error: error.message })
    }

})

// DASHBOARD
app.get("/dashboard", authMiddleware, (req, res) => {

    res.json({
        message: "Welcome dashboard 🚀",
        user: req.user
    })

})

// AI HEALTH (GROQ + LLaMA 3)
app.post("/ai-health", async (req, res) => {

    try {

        const { symptoms } = req.body

        if (!symptoms) {
            return res.status(400).json({
                error: "Symptoms required"
            })
        }

        const chat = await groq.chat.completions.create({
            model: "llama3-70b-8192",
            messages: [
                {
                    role: "user",
                    content: `
User symptoms: ${symptoms}

Give:
1. Possible health issue
2. Stress analysis
3. Health suggestions

Keep response short and simple.
                    `
                }
            ]
        })

        res.json({
            reply: chat.choices[0].message.content
        })

    } catch (error) {

        console.log("GROQ ERROR:", error)

        res.status(500).json({
            error: error.message
        })

    }

})

// SERVER
app.listen(5000, () => {
    console.log("Server running on port 5000 🚀")
})
