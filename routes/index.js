
    
import express from "express";
import { homePage } from "../controllers/homeController.js";
import { loginPage, registerPage, forgotPasswordPage, dashboardPage, loginUser, registerUser, logoutUser } from "../controllers/authController.js";
import * as studentController from "../controllers/studentController.js";
import * as registrarController from "../controllers/registrarController.js";
import * as adminController from "../controllers/adminController.js";
import { requireAuth, requireRole, attachUser } from "../middleware/rbacMiddleware.js";

const router = express.Router();

// Apply user attachment to all routes
router.use(attachUser);

// Public routes
router.get("/", homePage);
router.get("/login", loginPage);
router.post("/login", loginUser);
router.get("/register", registerPage);
router.post("/register", registerUser);
router.get("/forgot-password", forgotPasswordPage);
router.get("/logout", logoutUser);

// Student routes
router.get("/student/dashboard", requireRole('student'), studentController.getDashboard);
router.get("/student/requests", requireRole('student'), studentController.getMyRequests);
router.get("/student/request/new", requireRole('student'), studentController.getRequestForm);
router.post("/student/request/create", requireRole('student'), studentController.createRequest);
router.get("/student/requests/:id", requireRole('student'), studentController.getRequestDetails);
router.post("/student/requests/:id/cancel", requireRole('student'), studentController.cancelRequest);
router.post("/student/appointment/schedule", requireRole('student'), studentController.scheduleAppointment);

// Registrar routes
router.get("/registrar/dashboard", requireRole('registrar', 'admin'), registrarController.getDashboard);
router.get("/registrar/requests", requireRole('registrar', 'admin'), registrarController.getPendingRequests);
router.get("/registrar/requests/:id", requireRole('registrar', 'admin'), registrarController.getRequestDetails);
router.post("/registrar/requests/:id/status", requireRole('registrar', 'admin'), registrarController.updateRequestStatus);
router.post("/registrar/requests/:id/ready", requireRole('registrar', 'admin'), registrarController.markReadyForPickup);
router.post("/registrar/requests/:id/complete", requireRole('registrar', 'admin'), registrarController.completeRequest);
router.get("/registrar/appointments", requireRole('registrar', 'admin'), registrarController.getAppointments);
router.post("/registrar/appointments/:id/status", requireRole('registrar', 'admin'), registrarController.updateAppointmentStatus);
router.get("/registrar/report", requireRole('registrar', 'admin'), registrarController.generateReport);

// Admin routes
router.get("/admin/dashboard", requireRole('admin'), adminController.getDashboard);
router.get("/admin/users", requireRole('admin'), adminController.getUsers);
router.get("/admin/users/:id", requireRole('admin'), adminController.getUserDetails);
router.post("/admin/users/:id/role", requireRole('admin'), adminController.updateUserRole);
router.post("/admin/users/:id/status", requireRole('admin'), adminController.updateUserStatus);
router.post("/admin/users/:id/reset-password", requireRole('admin'), adminController.resetUserPassword);
router.post("/admin/users/:id/delete", requireRole('admin'), adminController.deleteUser);
router.get("/admin/analytics", requireRole('admin'), adminController.getAnalytics);

// Legacy route for backward compatibility
router.get("/dashboard", requireAuth, dashboardPage);

export default router;
