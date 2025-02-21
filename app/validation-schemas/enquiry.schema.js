import { z } from "zod";

export const enquirySchema = z.object({
  transaction_type: z.enum(["buy", "sell"], {
    required_error: "You need to select a transaction type.",
  }),
  share_id: z.string().nonempty("Please select a share."),
  quantity: z
    .number({
      required_error: "Quantity is required.",
      invalid_type_error: "Quantity must be a number.",
    })
    .positive("Quantity must be positive."),
  price_per_share: z
    .number({
      required_error: "Price is required.",
      invalid_type_error: "Price must be a number.",
    })
    .positive("Price must be positive."),
  message: z
    .string()
    .max(500, "Details must not exceed 500 characters.")
    .optional(),
  name: z
    .string({ required_error: "Name is required*" })
    .min(1, { message: "Name is required*" }),
  email: z.string({ required_error: "Email is required*" }).email(),
  phone: z
    .string({ required_error: "Phone number is required*" })
    .min(1, { message: "Phone number is required*" }),
});
