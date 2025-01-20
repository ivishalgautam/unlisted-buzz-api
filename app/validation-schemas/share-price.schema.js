import { z } from "zod";

export const sharePriceSchema = z.object({
  price: z
    .number({ required_error: "Price is required*" })
    .min(0, { message: "Price is required*" }),
  date: z
    .string({ required_error: "Date is required*" })
    .min(1, { message: "Date is required*" }),
});
