import { z } from "zod";

export const querySchema = z.object({
  name: z.string({ required_error: "required*" }).min(1, "Name is required"),
  email: z
    .string({ required_error: "required*" })
    .email("Invalid email address"),
  phone: z
    .string({ required_error: "required*" })
    .min(1, "Phone number is required"),
  subject: z
    .string({ required_error: "required*" })
    .min(1, "Subject is required"),
  source: z
    .string({ required_error: "required*" })
    .min(1, "Source is required"),
  message: z
    .string({ required_error: "required*" })
    .min(1, "Message is required"),
});
