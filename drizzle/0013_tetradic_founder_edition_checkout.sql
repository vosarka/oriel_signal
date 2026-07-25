-- Tetradic Founder Edition checkout and intake persistence.
-- Existing Signature Letter product values and Stripe records remain valid.

ALTER TABLE `signature_orders`
  MODIFY COLUMN `productType`
    enum('glimpse', 'founding', 'tetradic_founder_edition') NOT NULL;
--> statement-breakpoint
ALTER TABLE `signature_orders`
  ADD COLUMN `paymentProvider` enum('stripe', 'paypal') NOT NULL DEFAULT 'stripe';
--> statement-breakpoint
ALTER TABLE `signature_orders`
  ADD COLUMN `paypalOrderId` varchar(255) NULL;
--> statement-breakpoint
ALTER TABLE `signature_orders`
  ADD COLUMN `paypalCaptureId` varchar(255) NULL;
--> statement-breakpoint
ALTER TABLE `signature_orders`
  ADD COLUMN `deliveryDueAt` timestamp NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_signature_orders_paypal_order`
  ON `signature_orders` (`paypalOrderId`);
--> statement-breakpoint
CREATE UNIQUE INDEX `uq_signature_orders_paypal_capture`
  ON `signature_orders` (`paypalCaptureId`);
--> statement-breakpoint
ALTER TABLE `signature_intakes`
  ADD COLUMN `questionOne` text NULL;
--> statement-breakpoint
ALTER TABLE `signature_intakes`
  ADD COLUMN `questionTwo` text NULL;
