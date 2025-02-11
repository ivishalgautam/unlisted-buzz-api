import { z } from "zod";

export const transactionSchema = z.object({
  investment_id: z.string({ required_error: "Investment is required*" }).uuid(),
  quantity: z
    .number({ required_error: "Please enter quantity*" })
    .positive("Quantity must be greater than 0")
    .max(2147483647, { message: "Quantity must be less than 2147483647" }),
  price: z
    .number({ required_error: "Please enter Price*" })
    .positive("Price must be greater than 0")
    .max(2147483647, { message: "Quantity must be less than 2147483647" }),
  type: z.enum(["buy", "sell"]),
  date: z
    .string({ required_error: "Date is required*" })
    .refine((date) => !isNaN(Date.parse(date)), "Invalid date format"),
});
