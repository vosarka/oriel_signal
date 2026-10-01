CREATE TABLE IF NOT EXISTS `orielAmendments` (
  `id` int AUTO_INCREMENT NOT NULL,
  `text` text NOT NULL,
  `reason` text NOT NULL,
  `status` enum('proposed','approved','rejected','retired') NOT NULL DEFAULT 'proposed',
  `source` varchar(16) NOT NULL,
  `decidedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);
