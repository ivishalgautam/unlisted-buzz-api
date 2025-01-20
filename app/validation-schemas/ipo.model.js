import { z } from "zod";

export const ipoSchema = z.object({
  ipo_price: z
    .number({ required_error: "IPO Price is required." })
    .min(1, { message: "IPO Price is required." }),
});
