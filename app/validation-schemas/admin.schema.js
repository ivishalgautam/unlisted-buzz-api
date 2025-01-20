import { z } from "zod";

export const adminSchema = z.object({
  username: z
    .string({ required_error: "Username is required.." })
    .min(3, "Username must be at least 3 characters.")
    .max(16, "Username must be no more than 16 characters.")
    .regex(/^[0-9A-Za-z]+$/, "Username must be alphanumeric."),
  password: z
    .string({ required_error: "Password is required." })
    .min(1, { message: "Password is required." }),
});
