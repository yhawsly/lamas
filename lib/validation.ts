import { z } from "zod";

// Submission validation
export const submissionSchema = z.object({
    type: z.enum(["SEMESTER_CALENDAR", "COURSE_TOPICS", "OBSERVATION_REPORT", "WEEKLY_TOPICS"], {
        errorMap: () => ({ message: "Please select a valid submission type" })
    }),
    title: z.string()
        .min(3, "Title must be at least 3 characters")
        .max(200, "Title cannot exceed 200 characters"),
    content: z.string()
        .min(10, "Content must be at least 10 characters")
        .max(5000, "Content cannot exceed 5000 characters")
        .optional()
        .or(z.literal("")),
    deadlineId: z.string().optional().nullable(),
    isDraft: z.boolean().default(false),
});

// Observation validation
export const observationSchema = z.object({
    lecturerId: z.number().int().positive("Invalid lecturer ID"),
    observerId: z.number().int().positive("Invalid observer ID"),
    sessionDate: z.string()
        .refine(date => new Date(date) > new Date(), "Session date must be in the future"),
    courseCode: z.string()
        .min(3, "Course code must be at least 3 characters")
        .max(20, "Course code cannot exceed 20 characters"),
});

// Observation report validation
export const observationReportSchema = z.object({
    strengths: z.string()
        .min(10, "Strengths must be at least 10 characters")
        .max(1000, "Strengths cannot exceed 1000 characters"),
    improvements: z.string()
        .min(10, "Improvements must be at least 10 characters")
        .max(1000, "Improvements cannot exceed 1000 characters"),
    rating: z.number()
        .int()
        .min(1, "Rating must be between 1 and 10")
        .max(10, "Rating must be between 1 and 10"),
});

// Notification validation
export const notificationSchema = z.object({
    message: z.string()
        .min(1, "Message cannot be empty")
        .max(500, "Message cannot exceed 500 characters"),
    userId: z.string().optional().nullable(),
    targetRole: z.enum(["LECTURER", "HOD", "ADMIN"], {
        errorMap: () => ({ message: "Invalid role" })
    }).optional(),
});

// Deadline validation
export const deadlineSchema = z.object({
    title: z.string()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title cannot exceed 100 characters"),
    description: z.string()
        .max(500, "Description cannot exceed 500 characters")
        .optional(),
    type: z.enum(["SEMESTER_CALENDAR", "COURSE_TOPICS", "OBSERVATION_REPORT", "WEEKLY_TOPICS"], {
        errorMap: () => ({ message: "Please select a valid deadline type" })
    }),
    dueDate: z.string()
        .refine(date => new Date(date) > new Date(), "Due date must be in the future"),
});

// User profile update validation
export const userProfileSchema = z.object({
    name: z.string()
        .min(2, "Name must be at least 2 characters")
        .max(100, "Name cannot exceed 100 characters"),
    email: z.string()
        .email("Invalid email address"),
    phone: z.string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number")
        .optional(),
});

// Password change validation
export const passwordSchema = z.object({
    currentPassword: z.string()
        .min(1, "Current password is required"),
    newPassword: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
export type ObservationInput = z.infer<typeof observationSchema>;
export type ObservationReportInput = z.infer<typeof observationReportSchema>;
export type NotificationInput = z.infer<typeof notificationSchema>;
export type DeadlineInput = z.infer<typeof deadlineSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type PasswordInput = z.infer<typeof passwordSchema>;
