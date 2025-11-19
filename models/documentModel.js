/*
    MIT License
    
    Copyright (c) 2025 Christian I. Cabrera || XianFire Framework
    Mindoro State University - Philippines

    MinSU DocuReg - Document Request Model
    */

import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";
import { User } from "./userModel.js";

export const DocumentRequest = sequelize.define("DocumentRequest", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  documentType: {
    type: DataTypes.ENUM(
      'transcript',
      'diploma',
      'certificate',
      'verification',
      'enrollment_certificate',
      'good_moral'
    ),
    allowNull: false
  },
  purpose: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'ready', 'completed', 'rejected'),
    defaultValue: 'pending'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  rejectionReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id'
    }
  },
  completedAt: {
    type: DataTypes.DATE,
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
DocumentRequest.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
DocumentRequest.belongsTo(User, { as: 'registrar', foreignKey: 'processedBy' });

export { sequelize };
