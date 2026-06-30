-- GIF, sticker, location, and contact message types
ALTER TYPE public.message_content_type ADD VALUE IF NOT EXISTS 'gif';
ALTER TYPE public.message_content_type ADD VALUE IF NOT EXISTS 'sticker';
ALTER TYPE public.message_content_type ADD VALUE IF NOT EXISTS 'location';
ALTER TYPE public.message_content_type ADD VALUE IF NOT EXISTS 'contact';
