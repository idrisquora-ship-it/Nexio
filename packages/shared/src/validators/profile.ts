import { z } from "zod";

export const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(30, "Username must be at most 30 characters")
  .regex(
    /^[a-z0-9_]+$/,
    "Use lowercase letters, numbers, and underscores only",
  );

export const displayNameSchema = z
  .string()
  .min(1, "Display name is required")
  .max(50, "Display name is too long");

export const profileSetupSchema = z.object({
  username: usernameSchema,
  displayName: displayNameSchema,
});

export type ProfileSetupInput = z.infer<typeof profileSetupSchema>;
