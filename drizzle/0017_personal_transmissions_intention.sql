-- What the Seeker brings to a transmission: their own words, and consent
-- for ORIEL to draw on what it remembers of their conversations.
ALTER TABLE personal_transmissions ADD COLUMN intention text NULL, ADD COLUMN useMemories boolean NOT NULL DEFAULT false;
