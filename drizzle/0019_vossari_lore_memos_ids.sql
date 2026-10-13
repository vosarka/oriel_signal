-- The lore memory (MindMemOS) ids of each Vossari lore entry, so a search hit
-- is found again even when the service rewords the text and drops our prefix.
ALTER TABLE vossari_lore ADD COLUMN memosIds text NULL;
