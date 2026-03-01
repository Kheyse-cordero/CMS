
    
import bcrypt from "bcrypt";
import { User, sequelize } from "../models/userModel.js";

export const loginPage = (req, res) => res.redirect("/?modal=login");
export const registerPage = (req, res) => res.redirect("/?modal=register");
export const forgotPasswordPage = (req, res) => res.render("forgotpassword", { title: "Forgot Password" });

export const dashboardPage = (req, res) => {
  if (!req.session.userId) return res.redirect("/login");
  res.render("dashboard", { title: "Dashboard", user: req.user });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.redirect("/?modal=login&error=" + encodeURIComponent("User not found"));
    }
    
    if (user.status === 'inactive') {
      return res.redirect("/?modal=login&error=" + encodeURIComponent("Your account is inactive. Contact administrator."));
    }
    
    if (user.status === 'suspended') {
      return res.redirect("/?modal=login&error=" + encodeURIComponent("Your account has been suspended."));
    }
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.redirect("/?modal=login&error=" + encodeURIComponent("Incorrect password"));
    }
    
    req.session.userId = user.id;
    req.session.userRole = user.role;
    
    // Redirect based on role
    if (user.role === 'admin') {
      return res.redirect("/admin/dashboard");
    } else if (user.role === 'registrar') {
      return res.redirect("/registrar/dashboard");
    }
    
    res.redirect("/student/dashboard");
  } catch (err) {
    console.error("Login error:", err);
    res.render("login", { 
      title: "Login", 
      error: "An error occurred during login" 
    });
  }
};

export const registerUser = async (req, res) => {
  const { name, email, password, studentId } = req.body;
  
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.redirect("/?modal=register&error=" + encodeURIComponent("Email already registered"));
    }
    
    // Determine role based on email domain
    let role = 'student';
    const emailLower = email.toLowerCase();
    const emailDomain = emailLower.split('@')[1];
    const emailPrefix = emailLower.split('@')[0];
    
    // Admin email domains only
    const adminDomains = ['msu.edu.ph', 'mindoro.edu.ph', 'admin.msu'];
    const registrarDomains = ['registrar.msu', 'registrar.edu.ph'];
    
    // Check if domain exactly matches admin or registrar domains
    if (adminDomains.includes(emailDomain)) {
      role = 'admin';
    } else if (registrarDomains.includes(emailDomain)) {
      role = 'registrar';
    }
    
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      password: hashed,
      studentId: studentId || null,
      role: role,
      status: 'active'
    });
    
    req.session.userId = user.id;
    req.session.userRole = user.role;
    
    // Redirect based on role
    if (role === 'admin') {
      return res.redirect("/admin/dashboard");
    } else if (role === 'registrar') {
      return res.redirect("/registrar/dashboard");
    }
    
    res.redirect("/student/dashboard");
  } catch (err) {
    console.error("Registration error:", err);
    res.redirect("/?modal=register&error=" + encodeURIComponent(err.message || "An error occurred during registration"));
  }
};

export const logoutUser = (req, res) => {
  req.session.destroy();
  res.redirect("/?loggedOut=1");
};

