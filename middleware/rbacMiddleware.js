/*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines

    MinSU DocuReg - Role-Based Access Control Middleware
    */

import { User } from "../models/userModel.js";

/**
 * Middleware to verify user is authenticated
 */
export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect("/login");
  }
  next();
};

/**
 * Middleware to verify user has specific role(s)
 * @param {...string} allowedRoles - Roles allowed to access this route
 */
export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.session.userId) {
      return res.redirect("/login");
    }

    try {
      const user = await User.findByPk(req.session.userId);
      if (!user) {
        req.session.destroy();
        return res.redirect("/login");
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).render("error", {
          title: "Access Denied",
          message: "You do not have permission to access this page",
          statusCode: 403
        });
      }

      // Attach user to request for use in controllers
      req.user = user;
      next();
    } catch (err) {
      console.error("RBAC Error:", err);
      res.status(500).send("Server error");
    }
  };
};

/**
 * Middleware to check if user is admin or registrar
 */
export const requireStaff = (req, res, next) => {
  return requireRole('admin', 'registrar')(req, res, next);
};

/**
 * Middleware to attach current user to request
 */
export const attachUser = async (req, res, next) => {
  if (req.session.userId) {
    try {
      req.user = await User.findByPk(req.session.userId);
    } catch (err) {
      console.error("Error attaching user:", err);
    }
  }
  next();
};

export default {
  requireAuth,
  requireRole,
  requireStaff,
  attachUser
};
