import { z } from "zod";
import type { CloudinaryResourceType } from "@/core/lib/types";

export const createPostSchema = z.object({
  _id: z.string().nullable(),
  title: z.string().min(1, {
    message: "Title is required",
  }),
  slug: z.string().min(1, {
    message: "Slug is required",
  }),
  excerpt: z.string().optional(),
  documentJson: z.string().optional(),
  documentHtml: z.string().optional(),
  published: z.boolean(),
  publishedAt: z.string().datetime({ offset: true }).pipe(z.coerce.date()).nullable(),
  author: z.string().nullable(),
  coverImage: z.custom<CloudinaryResourceType>(),
  categories: z.array(z.string()),
});
