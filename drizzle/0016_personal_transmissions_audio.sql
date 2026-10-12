-- The voice of a personal transmission, kept on its row (MP3, base64).
-- Railway has no object storage configured, and storagePut skipped silently.
ALTER TABLE personal_transmissions ADD COLUMN audioBase64 longtext NULL;
