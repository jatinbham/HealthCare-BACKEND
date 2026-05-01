import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { GoogleGenerativeAI } from "@google/generative-ai"

import User from "./models/User.js"

dotenv.config()

console.log("Gemini Key:", process.env.GEMINI_API_KEY)

const genAI = new GoogleGenerativeAI(
    process.env.GEMINI_API_KEY
)

const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash"
})

const app = express()

app.use(cors({
    origin: "*"
}))

app.use(express.json())

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected 🚀"))
.catch(err => console.log(err))



// AUTH MIDDLEWARE
const authMiddleware = (req, res, next) => {

    try {

        const token = req.headers.authorization

        if (!token) {

            return res.status(401).json({
                message: "No token provided"
            })

        }

        const verified = jwt.verify(
            token,
            process.env.JWT_SECRET
        )

        req.user = verified

        next()

    } catch (error) {

        res.status(401).json({
            message: "Invalid token"
        })

    }

}



// HOME ROUTE
app.get("/", (req, res) => {
    res.send("Backend Running 🚀")
})



// SIGNUP ROUTE
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

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        })

        res.status(201).json({
            message: "User created successfully"
        })

    } catch (error) {

        console.log(error)

        res.status(500).json({
            error: error.message
        })

    }

})



// LOGIN ROUTE
app.post("/login", async (req, res) => {

    try {

        const { email, password } = req.body

        const user = await User.findOne({ email })

        if (!user) {

            return res.status(400).json({
                message: "User not found"
            })

        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        )

        if (!isMatch) {

            return res.status(400).json({
                message: "Invalid password"
            })

        }

        const token = jwt.sign(

            {
                id: user._id
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d"
            }

        )

        res.status(200).json({

            message: "Login successful",

            token,

            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }

        })

    } catch (error) {

        console.log(error)

        res.status(500).json({
            error: error.message
        })

    }

})



// PROTECTED DASHBOARD ROUTE
app.get("/dashboard", authMiddleware, (req, res) => {

    res.status(200).json({

        message: "Welcome to dashboard 🚀",

        user: req.user

    })

})



// AI HEALTH ROUTE
app.post("/ai-health", async (req, res) => {

    try {

        console.log("AI Route Hit 🚀")

        const { symptoms } = req.body

        if (!symptoms) {

            return res.status(400).json({
                error: "Symptoms are required"
            })

        }

        const prompt = `
        User symptoms: ${symptoms}

        Give:
        1. Possible health issue
        2. Stress analysis
        3. Health suggestions

        Keep response short and simple.
        `

        const result = await model.generateContent(prompt)

        const response = await result.response

        const text = response.text()

        res.json({
            reply: text
        })

    } catch (error) {

        console.log("AI ERROR:", error)

        res.status(500).json({
            error: error.message
        })

    }

})



app.listen(5000, () => {
    console.log("Server running on port 5000 🚀")
})