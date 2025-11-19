/*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines

    MinSU DocuReg - Registrar Controller (Staff)
    */

import { DocumentRequest } from "../models/documentModel.js";
import { Appointment } from "../models/appointmentModel.js";
import { User } from "../models/userModel.js";
import { Op } from "sequelize";

/**
 * Registrar: Dashboard overview
 */
export const getDashboard = async (req, res) => {
  try {
    const stats = {
      pendingRequests: await DocumentRequest.count({ where: { status: 'pending' } }),
      processingRequests: await DocumentRequest.count({ where: { status: 'processing' } }),
      readyRequests: await DocumentRequest.count({ where: { status: 'ready' } }),
      totalRequests: await DocumentRequest.count(),
      todayAppointments: await Appointment.count({
        where: {
          appointmentDate: {
            [Op.between]: [new Date().setHours(0, 0, 0, 0), new Date().setHours(23, 59, 59, 999)]
          }
        }
      })
    };
    
    const recentRequests = await DocumentRequest.findAll({
      order: [['createdAt', 'DESC']],
      limit: 10,
      include: [{ model: User, as: 'student', attributes: ['name', 'email'] }]
    });
    
    res.render("registrar/dashboard", {
      title: "Registrar Dashboard",
      stats,
      recentRequests,
      user: req.user
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    res.render("error", {
      title: "Error",
      message: "Error loading dashboard",
      statusCode: 500
    });
  }
};

/**
 * Registrar: View all pending document requests
 */
export const getPendingRequests = async (req, res) => {
  try {
    const requests = await DocumentRequest.findAll({
      where: { status: 'pending' },
      include: [{ model: User, as: 'student', attributes: ['name', 'email', 'studentId'] }],
      order: [['createdAt', 'ASC']]
    });
    
    res.render("registrar/pending-requests", {
      title: "Pending Document Requests",
      requests,
      user: req.user
    });
  } catch (err) {
    console.error("Error fetching pending requests:", err);
    res.render("error", {
      title: "Error",
      message: "Error fetching requests",
      statusCode: 500
    });
  }
};

/**
 * Registrar: View request details and process it
 */
export const getRequestDetails = async (req, res) => {
  try {
    const request = await DocumentRequest.findByPk(req.params.id, {
      include: [
        { model: User, as: 'student', attributes: ['name', 'email', 'studentId'] }
      ]
    });
    
    if (!request) {
      return res.render("error", {
        title: "Not Found",
        message: "Request not found",
        statusCode: 404
      });
    }
    
    const appointments = await Appointment.findAll({
      where: { documentRequestId: request.id }
    });
    
    res.render("registrar/request-details", {
      title: "Process Request",
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
 * Registrar: Update request status
 */
export const updateRequestStatus = async (req, res) => {
  const { status, notes, rejectionReason } = req.body;
  
  try {
    const request = await DocumentRequest.findByPk(req.params.id);
    if (!request) {
      return res.render("error", {
        title: "Not Found",
        message: "Request not found",
        statusCode: 404
      });
    }
    
    await request.update({
      status,
      notes: notes || request.notes,
      rejectionReason: status === 'rejected' ? rejectionReason : null,
      processedBy: req.user.id,
      completedAt: ['completed', 'rejected'].includes(status) ? new Date() : request.completedAt
    });
    
    res.redirect(`/registrar/requests/${request.id}`);
  } catch (err) {
    console.error("Error updating request:", err);
    res.render("error", {
      title: "Error",
      message: "Error updating request",
      statusCode: 500
    });
  }
};

/**
 * Registrar: Mark document as ready for pickup
 */
export const markReadyForPickup = async (req, res) => {
  try {
    const request = await DocumentRequest.findByPk(req.params.id);
    if (!request) {
      return res.render("error", {
        title: "Not Found",
        message: "Request not found",
        statusCode: 404
      });
    }
    
    await request.update({
      status: 'ready',
      processedBy: req.user.id
    });
    
    res.redirect(`/registrar/requests/${request.id}`);
  } catch (err) {
    console.error("Error marking ready:", err);
    res.render("error", {
      title: "Error",
      message: "Error updating status",
      statusCode: 500
    });
  }
};

/**
 * Registrar: Complete document request
 */
export const completeRequest = async (req, res) => {
  try {
    const request = await DocumentRequest.findByPk(req.params.id);
    if (!request) {
      return res.render("error", {
        title: "Not Found",
        message: "Request not found",
        statusCode: 404
      });
    }
    
    await request.update({
      status: 'completed',
      processedBy: req.user.id,
      completedAt: new Date()
    });
    
    res.redirect("/registrar/dashboard");
  } catch (err) {
    console.error("Error completing request:", err);
    res.render("error", {
      title: "Error",
      message: "Error completing request",
      statusCode: 500
    });
  }
};

/**
 * Registrar: View all appointments
 */
export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.findAll({
      include: [
        { model: User, as: 'student', attributes: ['name', 'email', 'studentId'] },
        { model: DocumentRequest, attributes: ['documentType', 'status'] }
      ],
      order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']]
    });
    
    res.render("registrar/appointments", {
      title: "Appointments Schedule",
      appointments,
      user: req.user
    });
  } catch (err) {
    console.error("Error fetching appointments:", err);
    res.render("error", {
      title: "Error",
      message: "Error fetching appointments",
      statusCode: 500
    });
  }
};

/**
 * Registrar: Update appointment status
 */
export const updateAppointmentStatus = async (req, res) => {
  const { status, notes } = req.body;
  
  try {
    const appointment = await Appointment.findByPk(req.params.id);
    if (!appointment) {
      return res.render("error", {
        title: "Not Found",
        message: "Appointment not found",
        statusCode: 404
      });
    }
    
    await appointment.update({
      status,
      registrarNotes: notes || appointment.registrarNotes
    });
    
    res.redirect("/registrar/appointments");
  } catch (err) {
    console.error("Error updating appointment:", err);
    res.render("error", {
      title: "Error",
      message: "Error updating appointment",
      statusCode: 500
    });
  }
};

/**
 * Registrar: Generate report
 */
export const generateReport = async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    
    let where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    if (status) {
      where.status = status;
    }
    
    const requests = await DocumentRequest.findAll({
      where,
      include: [{ model: User, as: 'student', attributes: ['name', 'studentId'] }]
    });
    
    res.render("registrar/report", {
      title: "Document Request Report",
      requests,
      user: req.user,
      filters: { startDate, endDate, status }
    });
  } catch (err) {
    console.error("Error generating report:", err);
    res.render("error", {
      title: "Error",
      message: "Error generating report",
      statusCode: 500
    });
  }
};

export default {
  getDashboard,
  getPendingRequests,
  getRequestDetails,
  updateRequestStatus,
  markReadyForPickup,
  completeRequest,
  getAppointments,
  updateAppointmentStatus,
  generateReport
};
