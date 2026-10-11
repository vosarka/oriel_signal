-- Personal transmissions: Founder's Reading, Deep Garden monthly, Echo.
-- Hand-written like 0014: the drizzle journal stops at 0008. Apply on dev first.
CREATE TABLE IF NOT EXISTS `personal_transmissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NULL,
  `kind` enum('mirror','threshold','ritual','echo') NOT NULL,
  `source` enum('purchase','deep_garden','echo') NOT NULL,
  `period` varchar(7) NULL,
  `status` enum('pending_payment','requested','draft_ready','approved','voiced','delivered','failed') NOT NULL DEFAULT 'requested',
  `script` longtext NULL,
  `audioStorageKey` varchar(255) NULL,
  `accessToken` varchar(64) NOT NULL,
  `failureReason` text NULL,
  `priceEur` int NULL,
  `paypalOrderId` varchar(64) NULL,
  `paypalCaptureId` varchar(64) NULL,
  `paidAt` timestamp NULL,
  `approvedAt` timestamp NULL,
  `deliveredAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_personal_transmissions_token` (`accessToken`),
  UNIQUE KEY `uq_personal_transmissions_user_period` (`userId`, `period`),
  UNIQUE KEY `uq_personal_transmissions_paypal_order` (`paypalOrderId`),
  UNIQUE KEY `uq_personal_transmissions_paypal_capture` (`paypalCaptureId`),
  KEY `idx_personal_transmissions_status` (`status`)
);
