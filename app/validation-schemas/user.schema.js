import { z } from "zod";

export const userSchema = z.object({
  fullname: z
    .string({ required_error: "Fullname is required*" })
    .min(2, "Fullname must be at least 2 characters"),
  email: z
    .string({ required_error: "Email is required*" })
    .email("Invalid email address"),
  role: z
    .enum(["admin", "user"], { message: "Role is required." })
    .default("user"),

  // country_code: z
  //   .string({ required_error: "Country code is required." })
  //   .min(1, { message: "Country code is required." }),
  // mobile_number: z
  //   .string({ required_error: "Mobile number is required." })
  //   .min(1, { message: "Mobile number is required." }),
});
