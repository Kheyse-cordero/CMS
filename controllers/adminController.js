/*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines

    MinSU DocuReg - Admin Controller (System Admin)
    */

import { User } from "../models/userModel.js";
import { DocumentRequest } from "../models/documentModel.js";
import { Appointment } from "../models/appointmentModel.js";
import bcrypt from "bcrypt";
import { Op } from "sequelize";

/**
 * Admin: Dashboard overview
 */
export const getDashboard = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.render("error", {
        title: "Unauthorized",
        message: "Only administrators can access this page",
        statusCode: 403
      });
    }

    const stats = {
      totalUsers: await User.count(),
      totalStudents: await User.count({ where: { role: 'student' } }),
      totalRegistrars: await User.count({ where: { role: 'registrar' } }),
      totalAdmins: await User.count({ where: { role: 'admin' } }),
      activeUsers: await User.count({ where: { status: 'active' } }),
      inactiveUsers: await User.count({ where: { status: 'inactive' } }),
      suspendedUsers: await User.count({ where: { status: 'suspended' } }),
      totalRequests: await DocumentRequest.count(),
      pendingRequests: await DocumentRequest.count({ where: { status: 'pending' } }),
      processingRequests: await DocumentRequest.count({ where: { status: 'processing' } }),
      completedRequests: await DocumentRequest.count({ where: { status: 'completed' } }),
      totalAppointments: await Appointment.count(),
      scheduledAppointments: await Appointment.count({ where: { status: 'scheduled' } })
    };
    
    const recentUsers = await User.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    const recentRequests = await DocumentRequest.findAll({
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });
    
    res.render("admin/dashboard", {
      title: "System Administration Dashboard",
      stats,
      recentUsers,
      recentRequests,
      user: req.user
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.render("error", {
      title: "Error",
      message: "Error loading dashboard",
      statusCode: 500
    });
  }
};

/**
 * Admin: View all users
 */
export const getUsers = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.render("error", {
        title: "Unauthorized",
        message: "Only administrators can access this page",
        statusCode: 403
      });
    }

    const { role, status, search } = req.query;
    
    let where = {};
    if (role) where.role = role;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { studentId: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const users = await User.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });
    
    res.render("admin/users", {
      title: "User Management",
      users,
      user: req.user,
      filters: { role, status, search }
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    res.render("error", {
      title: "Error",
      message: "Error fetching users",
      statusCode: 500
    });
  }
};

/**
 * Admin: View user details
 */
export const getUserDetails = async (req, res) => {
  try {
    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser) {
      return res.render("error", {
        title: "Not Found",
        message: "User not found",
        statusCode: 404
      });
    }
    
    const userRequests = await DocumentRequest.findAll({
      where: { studentId: targetUser.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.render("admin/user-details", {
      title: `User: ${targetUser.name}`,
      targetUser,
      userRequests,
      user: req.user
    });
  } catch (err) {
    console.error("Error fetching user details:", err);
    res.render("error", {
      title: "Error",
      message: "Error fetching user",
      statusCode: 500
    });
  }
};

/**
 * Admin: Update user role
 */
export const updateUserRole = async (req, res) => {
  const { role } = req.body;
  
  try {
    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser) {
      return res.render("error", {
        title: "Not Found",
        message: "User not found",
        statusCode: 404
      });
    }
    
    // Prevent self-role change
    if (targetUser.id === req.user.id) {
      return res.render("error", {
        title: "Cannot Update",
        message: "Cannot change your own role",
        statusCode: 400
      });
    }
    
    await targetUser.update({ role });
    res.redirect(`/admin/users/${targetUser.id}`);
  } catch (err) {
    console.error("Error updating user role:", err);
    res.render("error", {
      title: "Error",
      message: "Error updating user",
      statusCode: 500
    });
  }
};

/**
 * Admin: Update user status
 */
export const updateUserStatus = async (req, res) => {
  const { status } = req.body;
  
  try {
    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser) {
      return res.render("error", {
        title: "Not Found",
        message: "User not found",
        statusCode: 404
      });
    }
    
    // Prevent self-suspension
    if (targetUser.id === req.user.id && status !== 'active') {
      return res.render("error", {
        title: "Cannot Update",
        message: "Cannot suspend your own account",
        statusCode: 400
      });
    }
    
    await targetUser.update({ status });
    res.redirect(`/admin/users/${targetUser.id}`);
  } catch (err) {
    console.error("Error updating user status:", err);
    res.render("error", {
      title: "Error",
      message: "Error updating user",
      statusCode: 500
    });
  }
};

/**
 * Admin: Reset user password
 */
export const resetUserPassword = async (req, res) => {
  const { newPassword } = req.body;
  
  try {
    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser) {
      return res.render("error", {
        title: "Not Found",
        message: "User not found",
        statusCode: 404
      });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await targetUser.update({ password: hashedPassword });
    
    res.redirect(`/admin/users/${targetUser.id}`);
  } catch (err) {
    console.error("Error resetting password:", err);
    res.render("error", {
      title: "Error",
      message: "Error resetting password",
      statusCode: 500
    });
  }
};

/**
 * Admin: Delete user
 */
export const deleteUser = async (req, res) => {
  try {
    const targetUser = await User.findByPk(req.params.id);
    if (!targetUser) {
      return res.render("error", {
        title: "Not Found",
        message: "User not found",
        statusCode: 404
      });
    }
    
    // Prevent self-deletion
    if (targetUser.id === req.user.id) {
      return res.render("error", {
        title: "Cannot Delete",
        message: "Cannot delete your own account",
        statusCode: 400
      });
    }
    
    await targetUser.destroy();
    res.redirect("/admin/users");
  } catch (err) {
    console.error("Error deleting user:", err);
    res.render("error", {
      title: "Error",
      message: "Error deleting user",
      statusCode: 500
    });
  }
};

/**
 * Admin: View system logs and analytics
 */
export const getAnalytics = async (req, res) => {
  try {
    // Verify user is admin
    if (req.user.role !== 'admin') {
      return res.render("error", {
        title: "Unauthorized",
        message: "Only administrators can access this page",
        statusCode: 403
      });
    }

    const requestsByStatus = await DocumentRequest.count({
      attributes: ['status'],
      group: ['status']
    });
    
    const requestsByType = await DocumentRequest.count({
      attributes: ['documentType'],
      group: ['documentType']
    });
    
    const userStats = {
      byRole: await User.count({ attributes: ['role'], group: ['role'] }),
      byStatus: await User.count({ attributes: ['status'], group: ['status'] })
    };
    
    res.render("admin/analytics", {
      title: "System Analytics",
      requestsByStatus,
      requestsByType,
      userStats,
      user: req.user
    });
  } catch (err) {
    console.error("Error fetching analytics:", err);
    res.render("error", {
      title: "Error",
      message: "Error fetching analytics",
      statusCode: 500
    });
  }
};

export default {
  getDashboard,
  getUsers,
  getUserDetails,
  updateUserRole,
  updateUserStatus,
  resetUserPassword,
  deleteUser,
  getAnalytics
};
