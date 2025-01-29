import { z } from "zod";

export const commentSchema = z.object({
  comment: z
    .string({ required_error: "Comment is required*" })
    .min(3, "Comment must be at least 2 characters"),
  share_id: z.string({ required_error: "Share id is required*" }).uuid(),
  comment_id: z.string().uuid().optional(),
});
