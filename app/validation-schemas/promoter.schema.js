import { z } from "zod";

export const promoterSchema = z.object({
  name: z
    .string({ required_error: "Name is required*" })
    .min(1, "Name is required*"),
  designation: z
    .string({ required_error: "Designation is required*" })
    .min(1, "Designation is required*"),
  experience: z
    .string({ required_error: "Experience is required*" })
    .min(1, "Experience is required*"),
  linkedin: z
    .string({ required_error: "LinkedIn is required*" })
    .min(1, "LinkedIn profile is required*")
    .url("Enter a valid LinkedIn URL*"),
});
