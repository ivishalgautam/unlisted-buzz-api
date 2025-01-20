import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string({ required_error: "Username is required." })
    .min(1, { message: "Username is required." }),
  password: z
    .string({ required_error: "Password is required." })
    .min(1, { message: "Password is required." }),
});

export const customerLoginSchema = z.object({
  email: z.string({ required_error: "Email is required." }).email(),
});
