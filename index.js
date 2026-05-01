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

// MIDDLEWARE
app.use(cors({ origin: "*" }))
app.use(express.json())

// DB CONNECT
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected 🚀"))
.catch(err => console.log("DB Error:", err))

// GROQ SETUP
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
})

// AUTH MIDDLEWARE
const authMiddleware = (req, res, next) => {

    try {
        const token = req.headers.authorization?.split(" ")[1]

        if (!token) {
            return res.status(401).json({
                message: "No token provided"
            })
        }

        const verified = jwt.verify(token, process.env.JWT_SECRET)
        req.user = verified

        next()

    } catch (error) {
        return res.status(401).json({
            message: "Session expired, please login again"
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

        if (!name || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            })
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters"
            })
        }

        const existing = await User.findOne({ email })

        if (existing) {
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
            message: "User created successfully"
        })

    } catch (error) {

        res.status(500).json({
            error: error.message
        })

    }

})

// LOGIN
app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body

        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: "User not found"
            })
        }

        const match = await bcrypt.compare(password, user.password)

        if (!match) {
            return res.status(400).json({
                message: "Invalid password"
            })
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.json({
            message: "Login success",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        })

    } catch (error) {

        res.status(500).json({
            error: error.message
        })

    }

})

// DASHBOARD
app.get("/dashboard", authMiddleware, (req, res) => {

    res.json({
        message: "Welcome dashboard 🚀",
        user: req.user
    })

})

// ✅ AI HEALTH ROUTE (CHATGPT STYLE)
app.post("/ai-health", async (req, res) => {

    try {

        let { symptoms } = req.body

        if (!symptoms) {
            return res.status(400).json({
                error: "Symptoms required"
            })
        }

        // ✅ sanitize input
        symptoms = symptoms.trim().slice(0, 300)

        const chat = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content: `
You are a friendly AI doctor.

Rules:
- Talk like a real doctor chatting with a patient
- Use simple, natural language
- Keep response between 3-5 sentences
- Do NOT use labels like "Issue:", "Advice:", etc.
- Do NOT sound robotic
- Always end with a gentle precaution
- Never claim to be a real doctor
`
                },
                {
                    role: "user",
                    content: symptoms
                }
            ]
        })

        res.json({
            reply: chat.choices[0].message.content
        })

    } catch (error) {

        console.log("AI ERROR:", error)

        res.status(500).json({
            error: error.message
        })

    }

})

// SERVER START
app.listen(5000, () => {
    console.log("Server running on port 5000 🚀")
})
