import express from "express"
import mongoose from "mongoose"
import cors from "cors"
import dotenv from "dotenv"
import User from "./models/User.js"

dotenv.config()

const app = express()

// middlewares
app.use(cors({
    origin: "*"
}))
app.use(express.json())

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
.then(() => {
    console.log("MongoDB Connected 🚀")
})
.catch((err) => {
    console.log("MongoDB Error ❌", err)
})

// test route
app.get("/", (req, res) => {
    res.send("Backend Running 🚀")
})

// SIGNUP ROUTE
app.post("/signup", async (req, res) => {

    try {

        console.log("Request Body:", req.body)

        const { name, email, password } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        const user = await User.create({
            name,
            email,
            password
        })

        res.status(200).json({
            success: true,
            user
        })

    } catch (error) {

        console.log("Backend Error ❌", error)

        res.status(500).json({
            success: false,
            error: error.message
        })
    }
})

// server start
app.listen(5000, () => {
    console.log("Server running on port 5000 🚀")
})
