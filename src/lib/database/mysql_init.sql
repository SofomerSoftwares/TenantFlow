-- =====================================================================
-- Tenant List Updater - MySQL Database Engine Schema
-- Compatible with MySQL 8.0+, MariaDB 10.5+, AWS RDS MySQL, Cloud SQL MySQL
-- Character Set: utf8mb4, Collation: utf8mb4_unicode_ci
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `tenant_updater`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `tenant_updater`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `password` VARCHAR(255) NULL,
  `role` ENUM('ADMIN', 'STAFF', 'VIEWER') NOT NULL DEFAULT 'STAFF',
  `avatar` VARCHAR(10) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tenants Master Table
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_code` VARCHAR(64) NOT NULL,
  `tenant_name` VARCHAR(255) NOT NULL,
  `unit` VARCHAR(64) NOT NULL,
  `branch` VARCHAR(128) NULL,
  `floor` VARCHAR(64) NULL,
  `phone` VARCHAR(64) NULL,
  `email` VARCHAR(191) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'TERMINATED') NOT NULL DEFAULT 'ACTIVE',
  `rent` DECIMAL(12,2) NULL,
  `contract_start` DATE NULL,
  `contract_end` DATE NULL,
  `category` VARCHAR(128) NULL,
  `raw_fields` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tenants_tenant_code_unique` (`tenant_code`),
  INDEX `idx_tenants_tenant_code` (`tenant_code`),
  INDEX `idx_tenants_status` (`status`),
  INDEX `idx_tenants_branch` (`branch`),
  INDEX `idx_tenants_updated_at` (`updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Upload & Reconciliation Sessions
CREATE TABLE IF NOT EXISTS `upload_sessions` (
  `id` VARCHAR(36) NOT NULL,
  `master_file_name` VARCHAR(255) NOT NULL,
  `new_file_name` VARCHAR(255) NOT NULL,
  `summary` JSON NOT NULL,
  `applied_at` DATETIME(3) NULL,
  `applied_by` VARCHAR(128) NULL,
  `status` ENUM('DRAFT', 'APPLIED', 'DISCARDED') NOT NULL DEFAULT 'DRAFT',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_upload_sessions_created_at` (`created_at`),
  INDEX `idx_upload_sessions_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Tenant Field-Level Change History
CREATE TABLE IF NOT EXISTS `tenant_histories` (
  `id` VARCHAR(36) NOT NULL,
  `tenant_code` VARCHAR(64) NOT NULL,
  `tenant_name` VARCHAR(255) NOT NULL,
  `field` VARCHAR(128) NOT NULL,
  `old_value` TEXT NULL,
  `new_value` TEXT NULL,
  `change_type` ENUM('NEW', 'UPDATED', 'UNCHANGED', 'MISSING', 'DUPLICATE', 'ERROR', 'DEACTIVATED', 'REMOVED') NOT NULL DEFAULT 'UPDATED',
  `updated_by` VARCHAR(128) NOT NULL,
  `updated_date` DATE NOT NULL,
  `session_id` VARCHAR(64) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_histories_tenant_code` (`tenant_code`),
  INDEX `idx_histories_session_id` (`session_id`),
  INDEX `idx_histories_updated_date` (`updated_date`),
  CONSTRAINT `fk_histories_session` FOREIGN KEY (`session_id`) REFERENCES `upload_sessions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Audit Log Table
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(36) NOT NULL,
  `action` VARCHAR(128) NOT NULL,
  `details` TEXT NOT NULL,
  `user_name` VARCHAR(128) NOT NULL,
  `user_role` VARCHAR(32) NOT NULL,
  `user_id` VARCHAR(36) NULL,
  `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `idx_audit_logs_timestamp` (`timestamp`),
  CONSTRAINT `fk_audit_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Column Mapping Presets
CREATE TABLE IF NOT EXISTS `column_mapping_configs` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `is_default` BOOLEAN NOT NULL DEFAULT FALSE,
  `mapping` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
