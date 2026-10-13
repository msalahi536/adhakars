import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

export const suggestPhotoPalette = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ image: z.string().max(3_000_000), phase: z.enum(['morning', 'evening']) }))
  .handler(async ({ data }) => {
    if (!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(data.image)) return { ok: false as const, error: 'Please select a valid photo.', status: 400 };
    const key = process.env['LOVABLE_API_KEY'];
    if (!key) return { ok: false as const, error: 'AI color matching is not configured yet.', status: 401 };
    const { photoPalette } = await import('./theme-palette.server');
    return photoPalette(key, data.image, data.phase);
  });