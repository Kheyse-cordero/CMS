/*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines

    MinSU DocuReg - Document Request Controller (Student)
    */

import { DocumentRequest } from "../models/documentModel.js";
import { Appointment } from "../models/appointmentModel.js";
import { User } from "../models/userModel.js";
import { sequelize } from "../models/db.js";

/**
 * Student: View dashboard with stats and recent requests
 */
export const getDashboard = async (req, res) => {
  try {
    // Get all user's requests
    const allRequests = await DocumentRequest.findAll({
      where: { studentId: req.user.id },
      order: [['createdAt', 'DESC']]
    });

    // Count requests by status
    const totalRequests = allRequests.length;
    const pendingRequests = allRequests.filter(r => r.status === 'pending').length;
    const completedRequests = allRequests.filter(r => r.status === 'completed').length;
    const processingRequests = allRequests.filter(r => r.status === 'processing').length;
    const readyRequests = allRequests.filter(r => r.status === 'ready').length;

    // Get recent 5 requests
    const recentRequests = allRequests.slice(0, 5);

    res.render("student/dashboard", {
      title: "Student Dashboard",
      user: req.user,
      stats: {
        total: totalRequests,
        pending: pendingRequests,
        completed: completedRequests,
        processing: processingRequests,
        ready: readyRequests
      },
      recentRequests
    });
  } catch (err) {
    console.error("Error fetching dashboard:", err);
    res.render("student/dashboard", {
      title: "Student Dashboard",
      user: req.user,
      stats: { total: 0, pending: 0, completed: 0, processing: 0, ready: 0 },
      recentRequests: []
    });
  }
};

/**
 * Student: View all their document requests
 */
export const getMyRequests = async (req, res) => {
  try {
    const requests = await DocumentRequest.findAll({
      where: { studentId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.render("student/requests", {
      title: "My Document Requests",
      requests,
      user: req.user
    });
  } catch (err) {
    console.error("Error fetching requests:", err);
    res.render("error", {
      title: "Error",
      message: "Error fetching requests",
      statusCode: 500
    });
  }
};

/**
 * Student: View request form page
 */
export const getRequestForm = (req, res) => {
  res.render("student/request-form", {
    title: "Request Document",
    user: req.user
  });
};

/**
 * Student: Submit a new document request
 */
export const createRequest = async (req, res) => {
  const { documentType, purpose, quantity } = req.body;
  
  try {
    const request = await DocumentRequest.create({
      studentId: req.user.id,
      documentType,
      purpose,
      quantity: parseInt(quantity) || 1,
      status: 'pending'
    });
    
    res.redirect(`/student/requests/${request.id}`);
  } catch (err) {
    console.error("Error creating request:", err);
    res.render("student/request-form", {
      title: "Request Document",
      user: req.user,
      error: "Error creating request"
    });
  }
};

/**
 * Student: View specific request details
 */
export const getRequestDetails = async (req, res) => {
  try {
    const request = await DocumentRequest.findByPk(req.params.id, {
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'registrar', attributes: ['id', 'name'], foreignKey: 'processedBy' }
      ]
    });
    
    if (!request) {
      return res.render("error", {
        title: "Not Found",
        message: "Request not found",
        statusCode: 404
      });
    }
    
    // Verify ownership
    if (request.studentId !== req.user.id) {
      return res.render("error", {
        title: "Unauthorized",
        message: "You do not have permission to view this request",
        statusCode: 403
      });
    }
    
    const appointments = await Appointment.findAll({
      where: { documentRequestId: request.id }
    });
    
    res.render("student/request-details", {
      title: "Request Details",
      request,
      appointments,
      user: req.user
    });
  } catch (err) {
    console.error("Error fetching request details:", err);
    res.render("error", {
      title: "Error",
      message: "Error fetching request",
      statusCode: 500
    });
  }
};

/**
 * Student: Cancel a document request
 */
export const cancelRequest = async (req, res) => {
  try {
    const request = await DocumentRequest.findByPk(req.params.id);
    
    if (!request) {
      return res.render("error", {
        title: "Not Found",
        message: "Request not found",
        statusCode: 404
      });
    }
    
    if (request.studentId !== req.user.id) {
      return res.render("error", {
        title: "Unauthorized",
        message: "You do not have permission to cancel this request",
        statusCode: 403
      });
    }
    
    // Only allow cancellation if not processing or completed
    if (['processing', 'completed'].includes(request.status)) {
      return res.render("error", {
        title: "Cannot Cancel",
        message: "Cannot cancel this request. It is already being processed or completed.",
        statusCode: 400
      });
    }
    
    await request.update({ status: 'rejected', rejectionReason: 'Cancelled by student' });
    res.redirect("/student/dashboard");
  } catch (err) {
    console.error("Error cancelling request:", err);
    res.render("error", {
      title: "Error",
      message: "Error cancelling request",
      statusCode: 500
    });
  }
};

/**
 * Student: Schedule appointment for document pickup
 */
export const scheduleAppointment = async (req, res) => {
  const { documentRequestId, appointmentDate, appointmentTime } = req.body;
  
  try {
    const request = await DocumentRequest.findByPk(documentRequestId);
    
    if (!request) {
      return res.render("error", {
        title: "Not Found",
        message: "Request not found",
        statusCode: 404
      });
    }
    
    if (request.studentId !== req.user.id) {
      return res.render("error", {
        title: "Unauthorized",
        message: "You do not have permission to schedule appointments for this request",
        statusCode: 403
      });
    }
    
    const appointment = await Appointment.create({
      documentRequestId,
      studentId: req.user.id,
      appointmentDate,
      appointmentTime,
      status: 'scheduled'
    });
    
    res.redirect(`/student/requests/${documentRequestId}`);
  } catch (err) {
    console.error("Error scheduling appointment:", err);
    res.render("error", {
      title: "Error",
      message: "Error scheduling appointment",
      statusCode: 500
    });
  }
};

export default {
  getDashboard,
  getMyRequests,
  getRequestForm,
  createRequest,
  getRequestDetails,
  cancelRequest,
  scheduleAppointment
};
