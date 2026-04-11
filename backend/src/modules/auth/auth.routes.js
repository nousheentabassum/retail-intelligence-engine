import { Router } from "express";
import { registerUser, authenticateUser } from "./auth.service.js";
import { authMiddleware } from "./auth.middleware.js";

export const authRouter = Router();

// Register new user
authRouter.post("/register", async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Basic validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ 
        error: "Missing required fields: email, password, firstName, lastName" 
      });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ 
        error: "Password must be at least 6 characters long" 
      });
    }
    
    const user = await registerUser({
      email,
      password,
      firstName,
      lastName,
      role
    });
    
    res.status(201).json({
      message: "User registered successfully",
      user
    });
  } catch (err) {
    next(err);
  }
});

// Login user
authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        error: "Email and password are required" 
      });
    }
    
    const result = await authenticateUser(email, password);
    
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get current user profile (protected route)
authRouter.get("/profile", authMiddleware, async (req, res, next) => {
  try {
    res.json({
      user: req.user
    });
  } catch (err) {
    next(err);
  }
});
