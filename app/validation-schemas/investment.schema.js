import { z } from "zod";

export const inventmentSchema = z.object({
  share_id: z.string({ required_error: "Share is required*" }).uuid(),
  quantity: z
    .number({ required_error: "Please enter quantity*" })
    .int("Quantity must be an integer")
    .positive("Quantity must be greater than 0")
    .max(2147483647, { message: "Quantity must be less than 2147483647" }),
  purchase_price: z
    .number({ required_error: "Please enter purchase price*" })
    .positive("Purchase price must be greater than 0")
    .max(2147483647, {
      message: "Purchase price must be less than 2147483647",
    }),
  date_of_purchase: z
    .string({ required_error: "Date of purchase is required*" })
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
});
