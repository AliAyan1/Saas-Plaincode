-- Clear all data (keeps tables). Run when you want a fresh start.
-- Usage: mysql -u root -p ecommerce_support < database/clear.sql

USE ecommerce_support;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE activity_log;
TRUNCATE TABLE chat_messages;
TRUNCATE TABLE conversation_usage;
TRUNCATE TABLE forwarded_conversations;
TRUNCATE TABLE tickets;
TRUNCATE TABLE conversations;
TRUNCATE TABLE user_external_endpoints;
TRUNCATE TABLE chatbots;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;
