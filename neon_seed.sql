-- Neon Demo Account Seeding Script
-- Run this in Neon Dashboard → SQL Editor or your SQL client

-- Insert Departments
INSERT INTO "Department" (name, code) VALUES 
  ('Computer Science', 'CS'),
  ('Engineering', 'ENG'),
  ('Business Administration', 'BIZ')
ON CONFLICT DO NOTHING;

-- Get department IDs for reference
WITH depts AS (
  SELECT id, code FROM "Department" WHERE code IN ('CS', 'ENG', 'BIZ')
)

-- Insert Demo Users with hashed passwords
-- Password: password123 (bcrypt hash below)
-- Hash: $2a$12$JXDtfkF/3pIBRGlH5m/WdO3HI4Dqs5LvbLGLQvNpMfTM1qMmP7DWe
INSERT INTO "User" (email, name, "passwordHash", role, "departmentId", "isActive") VALUES
  ('superadmin@lamas.edu', 'Super Administrator', '$2a$12$JXDtfkF/3pIBRGlH5m/WdO3HI4Dqs5LvbLGLQvNpMfTM1qMmP7DWe', 'SUPER_ADMIN', NULL, true),
  ('admin@lamas.edu', 'System Administrator', '$2a$12$JXDtfkF/3pIBRGlH5m/WdO3HI4Dqs5LvbLGLQvNpMfTM1qMmP7DWe', 'ADMIN', NULL, true),
  ('hod.cs@lamas.edu', 'Dr. Ahmad Razif', '$2a$12$JXDtfkF/3pIBRGlH5m/WdO3HI4Dqs5LvbLGLQvNpMfTM1qMmP7DWe', 'HOD', (SELECT id FROM "Department" WHERE code = 'CS'), true),
  ('lecturer1@lamas.edu', 'Dr. Sarah Lim', '$2a$12$JXDtfkF/3pIBRGlH5m/WdO3HI4Dqs5LvbLGLQvNpMfTM1qMmP7DWe', 'LECTURER', (SELECT id FROM "Department" WHERE code = 'CS'), true),
  ('lecturer2@lamas.edu', 'Mr. Hafiz Rahman', '$2a$12$JXDtfkF/3pIBRGlH5m/WdO3HI4Dqs5LvbLGLQvNpMfTM1qMmP7DWe', 'LECTURER', (SELECT id FROM "Department" WHERE code = 'ENG'), true),
  ('lecturer3@lamas.edu', 'Ms. Priya Nair', '$2a$12$JXDtfkF/3pIBRGlH5m/WdO3HI4Dqs5LvbLGLQvNpMfTM1qMmP7DWe', 'LECTURER', (SELECT id FROM "Department" WHERE code = 'BIZ'), true)
ON CONFLICT (email) DO NOTHING;

-- DEMO ACCOUNTS:
-- superadmin@lamas.edu — Password: password123
-- admin@lamas.edu — Password: password123  
-- hod.cs@lamas.edu — Password: password123
-- lecturer1@lamas.edu — Password: password123
-- lecturer2@lamas.edu — Password: password123
-- lecturer3@lamas.edu — Password: password123
