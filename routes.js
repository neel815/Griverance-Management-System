import express from "express";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import User from "./models/User.js"; 
import Grievance from "./models/Grievance.js"; 
import mongoose from "mongoose";

const router = express.Router();

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//Home Route
router.get("/", (req, res) => {
  res.render("index"); // Renders views/index.ejs
});

// Register Page Route (GET)
router.get("/register", (req, res) => {
  res.render("register"); // Renders views/register.ejs
});

router.post("/register", async (req, res) => {
  try {
    const { Username, Email, Password, Role } = req.body; // Match exact names from form

    // Ensure all fields are provided
    if (!Username || !Email || !Password || !Role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(Password, 10);

    // Create and Save New User
    const newUser = new User({ name: Username, email: Email, password: hashedPassword, role: Role });
    await newUser.save();

    console.log("User Registered Successfully!");
    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Login Page Route (GET)
router.get("/login", (req, res) => {
  res.render("login");
});

//Login User (POST)
router.post("/login", async (req, res) => {
  try {
    const { Email, Password } = req.body; // Match exact form field names
   
    const user = await User.findOne({ email: Email });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const passwordMatch = await bcrypt.compare(Password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    console.log("Login Successful!");
    res.json({ message: "Login successful" });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

router.get("/submit-grievance", (req, res) => {
  res.render("submit-grievance"); 
});

// Submit Grievance
router.post("/submit-grievance", async (req, res) => {
  try {
    const { name, email, issue } = req.body;

    console.log("📌 Fetching last grievance ID...");
    const lastGrievance = await Grievance.findOne().sort({ grievance_id: -1 });

    let newId = 1; // Default to 1 if no grievances exist
    if (lastGrievance && lastGrievance.grievance_id) {
      newId = parseInt(lastGrievance.grievance_id, 10) + 1; // Ensure it's a number
    }
    console.log("✅ New Grievance ID:", newId);

    if (isNaN(newId)) {
      console.log("❌ Generated ID is NaN!");
      return res.status(500).json({ error: "Failed to generate a valid grievance ID" });
    }

    const newGrievance = new Grievance({
      grievance_id: newId, // ✅ Use numeric ID
      grievance_title: issue,
      grievance_desc: issue,
      status: "open",
    });

    await newGrievance.save();
    res.status(201).json({ message: "Grievance submitted successfully", grievance_id: newId });

  } catch (error) {
    console.error("❌ Grievance Submission Error:", error);
    res.status(500).json({ error: "Failed to submit grievance" });
  }
});



router.get("/grievance/:id/:user_id", async (req, res) => {
  try {
    console.log("📌 Received grievance ID:", req.params.id);

    const grievance = await Grievance.findOne({ grievance_id: req.params.id }); // ✅ Use custom ID instead of ObjectId
    if (!grievance) {
      console.log("❌ No grievance found for ID:", req.params.id);
      return res.status(404).send("Grievance not found");
    }

    res.render("grievance", {
      grievance_data: grievance,
      grievance_id: req.params.id,
      user_id: req.params.user_id,
    });

  } catch (error) {
    console.error("❌ Error fetching grievance:", error);
    res.status(500).send(`<h2>Something broke</h2><p>${error.message}</p>`);
  }
});


// Logout Route
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

export default router;
