import { z } from "zod";

export const customerSchema = z.object({
  residency: z.enum(["resident", "non-resident"]),
  country: z
    .string({ required_error: "Country is required*" })
    .min(1, "Please select a country"),
});
