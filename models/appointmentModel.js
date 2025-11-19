/*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines

    MinSU DocuReg - Appointment Model
    */

import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";
import { User } from "./userModel.js";
import { DocumentRequest } from "./documentModel.js";

export const Appointment = sequelize.define("Appointment", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  documentRequestId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: DocumentRequest,
      key: 'id'
    }
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  appointmentDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  appointmentTime: {
    type: DataTypes.TIME,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('scheduled', 'completed', 'missed', 'cancelled', 'rescheduled'),
    defaultValue: 'scheduled'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  registrarNotes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Define associations
Appointment.belongsTo(DocumentRequest, { foreignKey: 'documentRequestId' });
Appointment.belongsTo(User, { as: 'student', foreignKey: 'studentId' });

export { sequelize };
