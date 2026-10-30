import { z } from "zod";

export const mediaTypeSchema = z.enum(["IMAGE", "VIDEO", "CAROUSEL_ALBUM"]);

export const childMediaSchema = z.object({
  id: z.string().regex(/^\d+$/),
  media_type: mediaTypeSchema,
  media_url: z.string().url().optional(),
});

export const pagingSchema = z
  .object({ next: z.string().url().optional(), cursors: z.object({ after: z.string().optional() }).optional() })
  .optional();

export const igMediaSchema = z.object({
  id: z.string().regex(/^\d+$/),
  caption: z.string().optional(),
  media_type: mediaTypeSchema,
  media_product_type: z.string().optional(),
  media_url: z.string().url().optional(),
  permalink: z.string().url().optional(),
  timestamp: z.string(),
  children: z.object({ data: z.array(childMediaSchema), paging: pagingSchema }).optional(),
});

export const mediaPageSchema = z.object({ data: z.array(igMediaSchema), paging: pagingSchema });
export const childrenPageSchema = z.object({ data: z.array(childMediaSchema), paging: pagingSchema });

export type IgMedia = z.infer<typeof igMediaSchema>;
export type IgChildMedia = z.infer<typeof childMediaSchema>;

/** Error de la API Graph tal como lo devuelve Meta. */
export const graphErrorSchema = z.object({
  error: z.object({
    message: z.string().optional(),
    type: z.string().optional(),
    code: z.number().optional(),
    error_subcode: z.number().optional(),
  }),
});
