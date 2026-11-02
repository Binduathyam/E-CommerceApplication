-- MySQL dump 10.13  Distrib 8.4.11, for Win64 (x86_64)
--
-- Host: localhost    Database: shopease_db
-- ------------------------------------------------------
-- Server version	8.4.11

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `address_line` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `pincode` varchar(10) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (8,11,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-17 05:26:41'),(13,12,'Gdhv','5698442695','Zhjhkdulcnmx','Dulf','Tamil Nadu','656583','2026-08-17 09:50:51'),(14,12,'Devi','6524478523','Vhfs bdh','Elury','Tamil Nadu','632514','2026-08-17 09:52:39'),(15,12,'Bindu','9100432255','Main road','Tambaram','Tamil Nadu','600047','2026-08-17 09:58:39'),(16,12,'Triva','3625147890','Rosd','Eluru','Tamil Nadu','524489','2026-08-17 10:05:45'),(17,12,'Rishi','6521458795','Market','Chengalpattu','Tamil Nadu','600074','2026-08-17 11:15:58'),(18,12,'Dh','4598536556','Fucx','Dhvx','Tamil Nadu','569842','2026-08-17 11:29:35'),(19,12,'Thc','5698595384','Ch.','Xhnv','Tamil Nadu','568832','2026-08-17 11:32:20'),(25,12,'Bindu','9876543210','21, market','Tambaram','Tamilnadu','600074','2026-08-18 08:34:18'),(41,9,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-24 10:17:45'),(42,11,'Bindu','9852341765','New market','Eluru','Andhra Pradesh','534447','2026-08-27 07:22:53'),(43,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-03 11:27:17'),(44,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 04:32:45'),(45,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 04:49:41'),(46,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 04:58:43'),(47,9,'Bindu Athyam','9494005400','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 05:54:08'),(50,11,'Bindu Athyam','9494005400','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 06:10:07'),(51,11,'Bindu Athyam','9494005400','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 06:18:27'),(52,11,'Bindu Athyam','9494005400','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 06:25:31'),(53,11,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 06:57:16'),(54,11,'Bindu Athyam','9494005400','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 07:03:14'),(55,11,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 08:11:42'),(56,11,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 08:11:51'),(57,11,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 08:12:22'),(58,11,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-04 08:12:49'),(59,9,'Bindu Athyam','9010626662','west Tambaram, railwaystation','Chennai','Tamil Nadu','600073','2026-09-06 08:43:31'),(62,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-07 10:58:09'),(63,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-07 10:58:14'),(64,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-08 04:39:03'),(65,9,'Bindu Athyam','9010626662','25-125 ,DAARA VARI STREET\nNEW MARKET , JANGA REDDY GUDEM','WEST GODAVARI','Tamil Nadu','534447','2026-09-08 04:39:59'),(68,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-08 06:46:40');
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_product_ratings`
--

DROP TABLE IF EXISTS `admin_product_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_product_ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `admin_id` int NOT NULL,
  `rating` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_admin_product` (`product_id`,`admin_id`),
  CONSTRAINT `admin_product_ratings_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_product_ratings`
--

LOCK TABLES `admin_product_ratings` WRITE;
/*!40000 ALTER TABLE `admin_product_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `admin_product_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text,
  `discount` varchar(100) DEFAULT NULL,
  `button_text` varchar(100) DEFAULT 'Shop Now',
  `image` varchar(500) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_notifications`
--

DROP TABLE IF EXISTS `delivery_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `delivery_partner_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `delivery_partner_id` (`delivery_partner_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `delivery_notifications_ibfk_1` FOREIGN KEY (`delivery_partner_id`) REFERENCES `delivery_partners` (`id`) ON DELETE CASCADE,
  CONSTRAINT `delivery_notifications_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_notifications`
--

LOCK TABLES `delivery_notifications` WRITE;
/*!40000 ALTER TABLE `delivery_notifications` DISABLE KEYS */;
INSERT INTO `delivery_notifications` VALUES (2,1,30,'New Order Assigned','A new order #30 has been assigned to you',0,'2026-09-03 07:40:20'),(3,1,37,'New Order Assigned','A new order #37 has been assigned to you',0,'2026-09-04 04:58:43'),(4,1,36,'New Order Assigned','A new order #36 has been assigned to you',0,'2026-09-04 05:42:55'),(8,1,NULL,'New Order Assigned','A new order #38 has been assigned to you',0,'2026-09-06 09:45:56'),(9,1,NULL,'New Order Assigned','A new order #39 has been assigned to you',0,'2026-09-06 09:46:14'),(10,1,NULL,'Return Request','Return requested for order #50',0,'2026-09-06 15:41:27'),(11,1,NULL,'Return Request','Return requested for order #38',0,'2026-09-07 06:36:32'),(12,1,40,'New Order Assigned','A new order #40 has been assigned to you',0,'2026-09-07 06:43:58'),(13,1,41,'New Order Assigned','A new order #41 has been assigned to you',0,'2026-09-07 06:44:09'),(14,1,42,'New Order Assigned','A new order #42 has been assigned to you',0,'2026-09-07 06:44:23'),(15,1,43,'New Order Assigned','A new order #43 has been assigned to you',0,'2026-09-07 07:21:27'),(16,1,44,'New Order Assigned','A new order #44 has been assigned to you',0,'2026-09-07 07:30:45'),(17,1,48,'New Order Assigned','A new order #48 has been assigned to you',0,'2026-09-07 07:36:35'),(18,1,NULL,'New Order Assigned','A new order #51 has been assigned to you',0,'2026-09-07 07:39:36'),(19,1,53,'New Order Assigned','A new order #53 has been assigned to you',0,'2026-09-08 04:43:29'),(20,1,NULL,'New Order Assigned','A new order #57 has been assigned to you',0,'2026-09-08 08:35:17'),(21,1,NULL,'New Order Assigned','A new order #58 has been assigned to you',0,'2026-09-08 08:35:39'),(22,1,NULL,'New Order Assigned','A new order #63 has been assigned to you',0,'2026-09-10 09:28:21'),(23,1,NULL,'New Order Assigned','A new order #64 has been assigned to you',0,'2026-09-10 09:46:08'),(24,1,NULL,'Return Request','Return requested for order #64',0,'2026-09-10 09:57:50'),(25,1,NULL,'Return Request','Return requested for order #63',0,'2026-09-10 10:09:26'),(26,1,NULL,'Return Request','Return requested for order #57',0,'2026-09-10 10:47:21'),(27,1,NULL,'Return Request','Return requested for order #55',0,'2026-09-11 09:13:41'),(28,1,NULL,'New Order Assigned','A new order #66 has been assigned to you',0,'2026-09-16 07:06:59'),(29,1,NULL,'Return Request','Return requested for order #66',0,'2026-09-16 07:09:58'),(30,1,36,'Return Request','Return requested for order #36',0,'2026-09-17 04:41:54'),(31,1,52,'Return Request','Return requested for order #52',0,'2026-09-17 04:42:13'),(32,1,53,'Return Request','Return requested for order #53',0,'2026-09-17 04:42:40'),(33,1,67,'New Order Assigned','A new order #67 has been assigned to you',0,'2026-09-17 09:51:02'),(34,1,68,'New Order Assigned','A new order #68 has been assigned to you',0,'2026-09-18 04:17:25');
/*!40000 ALTER TABLE `delivery_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_partner_earnings`
--

DROP TABLE IF EXISTS `delivery_partner_earnings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_partner_earnings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `delivery_partner_id` int NOT NULL,
  `order_id` int NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT '50.00',
  `earning_type` varchar(30) NOT NULL DEFAULT 'Delivery',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_partner_order` (`delivery_partner_id`,`order_id`,`earning_type`),
  CONSTRAINT `delivery_partner_earnings_ibfk_1` FOREIGN KEY (`delivery_partner_id`) REFERENCES `delivery_partners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_partner_earnings`
--

LOCK TABLES `delivery_partner_earnings` WRITE;
/*!40000 ALTER TABLE `delivery_partner_earnings` DISABLE KEYS */;
INSERT INTO `delivery_partner_earnings` VALUES (1,1,57,50.00,'Return','2026-09-16 07:04:34'),(2,1,55,50.00,'Return','2026-09-16 07:05:22'),(3,1,66,50.00,'Delivery','2026-09-16 07:08:53'),(4,1,66,50.00,'Return','2026-09-16 07:10:39'),(5,1,53,50.00,'Return','2026-09-17 04:45:02'),(6,1,67,50.00,'Delivery','2026-09-17 09:52:31');
/*!40000 ALTER TABLE `delivery_partner_earnings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_partners`
--

DROP TABLE IF EXISTS `delivery_partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_partners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `vehicle_type` varchar(50) DEFAULT NULL,
  `vehicle_number` varchar(50) DEFAULT NULL,
  `license_number` varchar(100) DEFAULT NULL,
  `status` varchar(30) DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `availability_status` varchar(20) DEFAULT 'Offline',
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `location_updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_partners`
--

LOCK TABLES `delivery_partners` WRITE;
/*!40000 ALTER TABLE `delivery_partners` DISABLE KEYS */;
INSERT INTO `delivery_partners` VALUES (1,'Bindu Athyam','athyam@gmail.com','9949949493','$2b$10$MJyU7RiZl/EXl6dWgsP.4usljWVfdiddyqyEseMyk0azRBRxsQs.i','Bharath Institute of Higher Education and Research, Selaiyur, Tambaram','Chennai',NULL,'Bike','TN10AB1456','U84815848745','active','2026-09-02 08:05:51','Online',17.38500000,78.48670000,'2026-09-03 06:28:20'),(2,'test2','test2@gmail.com','6325148964','$2b$10$vwy9ebqpTLwvLA9yajH9neR78ZiC.ej35oHKLTUYjptWhZqxqLTuq','Jangareddygudem','Jangareddygudem',NULL,'Bike','HFYKJSTKMVNGZGJXHKDYKXL','MHXGJSYKFLHXBMX','active','2026-09-17 10:32:30','Online',NULL,NULL,NULL),(3,'Tester','test@gmail.com','6325417890','$2b$10$goQicOigW7Yj28YkIajp2O66i8LpOGaUFT3fjkCocteWSAxQtgMt6','Tambaram, Chennai',NULL,NULL,'Car','GDHYJSNGB','DKYDYEYJEH','active','2026-09-18 04:26:28','Offline',NULL,NULL,NULL),(4,'Gupta','gupta@gmail.com','6328147890','$2b$10$9pQed35miXMkqGVwH.Fcuub1FE1AurawqXYCMs9n2Qx/P8Yrchstm','25 market','Chennai','Tamilnadu','Car','JRUTJJY','DJCJC','active','2026-09-21 08:55:55','Online',NULL,NULL,NULL);
/*!40000 ALTER TABLE `delivery_partners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispatch_hubs`
--

DROP TABLE IF EXISTS `dispatch_hubs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dispatch_hubs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hub_code` varchar(30) NOT NULL,
  `hub_name` varchar(150) NOT NULL,
  `address` varchar(500) NOT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `pincode` varchar(10) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'Active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `hub_code` (`hub_code`),
  KEY `idx_hub_city` (`city`,`state`),
  KEY `idx_hub_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispatch_hubs`
--

LOCK TABLES `dispatch_hubs` WRITE;
/*!40000 ALTER TABLE `dispatch_hubs` DISABLE KEYS */;
/*!40000 ALTER TABLE `dispatch_hubs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hub_transfers`
--

DROP TABLE IF EXISTS `hub_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hub_transfers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `shipment_id` int NOT NULL,
  `origin_hub_id` int NOT NULL,
  `destination_hub_id` int NOT NULL,
  `transfer_status` varchar(40) NOT NULL DEFAULT 'Created',
  `transport_reference` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `dispatched_at` datetime DEFAULT NULL,
  `arrived_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_transfer_shipment` (`shipment_id`),
  KEY `idx_transfer_status` (`transfer_status`),
  KEY `idx_transfer_origin` (`origin_hub_id`),
  KEY `idx_transfer_destination` (`destination_hub_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hub_transfers`
--

LOCK TABLES `hub_transfers` WRITE;
/*!40000 ALTER TABLE `hub_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `hub_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merchant_shipments`
--

DROP TABLE IF EXISTS `merchant_shipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `merchant_shipments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `merchant_id` int NOT NULL,
  `delivery_partner_id` int DEFAULT NULL,
  `pickup_address` varchar(500) NOT NULL,
  `pickup_city` varchar(100) NOT NULL,
  `pickup_state` varchar(100) NOT NULL,
  `pickup_pincode` varchar(6) NOT NULL,
  `shipment_status` varchar(50) NOT NULL DEFAULT 'Preparing',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ready_at` datetime DEFAULT NULL,
  `assigned_at` datetime DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `tracking_number` varchar(60) DEFAULT NULL,
  `origin_hub_id` int DEFAULT NULL,
  `destination_hub_id` int DEFAULT NULL,
  `current_hub_id` int DEFAULT NULL,
  `pickup_partner_id` int DEFAULT NULL,
  `last_mile_partner_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_order_merchant` (`order_id`,`merchant_id`),
  KEY `idx_shipment_status` (`shipment_status`),
  KEY `idx_shipment_partner` (`delivery_partner_id`),
  KEY `idx_shipment_merchant` (`merchant_id`),
  KEY `idx_shipments_pickup_partner` (`pickup_partner_id`),
  KEY `idx_shipments_last_mile_partner` (`last_mile_partner_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `merchant_shipments`
--

LOCK TABLES `merchant_shipments` WRITE;
/*!40000 ALTER TABLE `merchant_shipments` DISABLE KEYS */;
/*!40000 ALTER TABLE `merchant_shipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=84 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (8,5,100,1,999.00),(18,11,97,1,12999.00),(20,13,97,1,12999.00),(21,14,100,1,999.00),(23,14,93,2,699.00),(43,30,101,1,2499.00),(44,32,102,1,1699.00),(46,35,102,1,1699.00),(47,36,101,3,500.00),(48,37,101,2,500.00),(51,40,97,1,12999.00),(52,41,95,1,1799.00),(53,42,91,1,1599.00),(54,43,88,1,499.00),(55,43,68,1,2699.00),(56,44,59,1,799.00),(57,48,101,1,500.00),(58,49,100,1,999.00),(61,52,107,1,200.00),(62,52,106,1,10000.00),(63,53,104,1,250.00),(80,67,109,1,200.00),(81,68,109,1,200.00),(82,69,112,2,60.00),(83,70,109,1,200.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `address_id` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `payment_status` varchar(50) DEFAULT 'Pending',
  `order_status` varchar(50) DEFAULT 'Placed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `shipping_address` json DEFAULT NULL,
  `delivery_partner_id` int DEFAULT NULL,
  `delivery_status` varchar(50) DEFAULT 'Not Assigned',
  `assigned_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` varchar(255) DEFAULT NULL,
  `return_requested_at` timestamp NULL DEFAULT NULL,
  `return_reason` varchar(255) DEFAULT NULL,
  `return_status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `address_id` (`address_id`),
  KEY `fk_delivery_partner` (`delivery_partner_id`),
  CONSTRAINT `fk_delivery_partner` FOREIGN KEY (`delivery_partner_id`) REFERENCES `delivery_partners` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (5,11,8,1608.00,'cod','Pending','Cancelled','2026-08-17 05:26:41',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL),(10,12,13,599.00,'Cash on Delivery','Pending','Placed','2026-08-17 09:50:51',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL),(11,12,14,12999.00,'Cash on Delivery','Pending','Placed','2026-08-17 09:52:39',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL),(12,12,15,599.00,'Cash on Delivery','Pending','Placed','2026-08-17 09:58:39',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL),(13,12,16,12999.00,'Cash on Delivery','Pending','Placed','2026-08-17 10:05:45',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL),(14,12,17,3395.00,'Cash on Delivery','Pending','Placed','2026-08-17 11:15:58',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL),(15,12,18,1198.00,'Cash on Delivery','Pending','Placed','2026-08-17 11:29:35',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL),(16,12,19,599.00,'Cash on Delivery','Pending','Placed','2026-08-17 11:32:20',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL),(30,9,41,2509.00,'Razorpay','Paid','Delivered','2026-08-24 10:18:10',NULL,1,'Delivered','2026-09-03 07:40:20',NULL,NULL,NULL,NULL,NULL),(32,9,41,1699.00,'Cash on Delivery','Paid','Delivered','2026-08-26 13:07:34',NULL,1,'Delivered','2026-09-02 09:55:05',NULL,NULL,NULL,NULL,NULL),(35,11,42,1699.00,'Razorpay','Paid','Delivered','2026-08-28 10:18:17',NULL,1,'Delivered','2026-09-02 11:27:08',NULL,NULL,NULL,NULL,NULL),(36,9,45,1510.00,'Razorpay','Paid','Delivered','2026-09-04 04:50:17',NULL,1,'Delivered','2026-09-04 05:42:55',NULL,NULL,'2026-09-17 04:41:54','Product quality is not good','Requested'),(37,9,46,1010.00,'Cash on Delivery','Pending','Cancelled','2026-09-04 04:58:43',NULL,1,'Cancelled','2026-09-04 04:58:43',NULL,NULL,NULL,NULL,NULL),(40,11,50,13009.00,'Razorpay','Paid','Delivered','2026-09-04 06:10:32',NULL,1,'Delivered','2026-09-07 06:43:58',NULL,NULL,NULL,NULL,NULL),(41,11,51,1809.00,'Razorpay','Paid','Delivered','2026-09-04 06:18:54',NULL,1,'Delivered','2026-09-07 06:44:09',NULL,NULL,NULL,NULL,NULL),(42,11,52,1609.00,'Razorpay','Paid','Delivered','2026-09-04 06:25:52',NULL,1,'Delivered','2026-09-07 06:44:23','2026-09-07 07:21:27',NULL,NULL,NULL,NULL),(43,11,53,3208.00,'Razorpay','Paid','Delivered','2026-09-04 06:57:39',NULL,1,'Delivered','2026-09-07 07:21:27','2026-09-07 07:30:45',NULL,NULL,NULL,NULL),(44,11,54,849.00,'Razorpay','Paid','Delivered','2026-09-04 07:03:37',NULL,1,'Delivered','2026-09-07 07:30:45','2026-09-07 07:36:34',NULL,NULL,NULL,NULL),(48,11,58,550.00,'Razorpay','Paid','Delivered','2026-09-04 08:13:28',NULL,1,'Delivered','2026-09-07 07:36:35','2026-09-07 07:39:36',NULL,NULL,NULL,NULL),(49,9,59,1009.00,'Razorpay','Paid','Cancelled','2026-09-06 08:44:00',NULL,NULL,'Cancelled',NULL,NULL,NULL,NULL,NULL,NULL),(52,9,63,10210.00,'Razorpay','Paid','Delivered','2026-09-07 10:58:47',NULL,1,'Delivered','2026-09-07 11:21:43','2026-09-07 11:23:22',NULL,'2026-09-17 04:42:13','Product quality is not good','Requested'),(53,9,64,300.00,'Razorpay','Paid','Delivered','2026-09-08 04:39:28',NULL,1,'Delivered','2026-09-08 04:43:29','2026-09-08 08:35:17',NULL,'2026-09-17 04:42:40','Wrong product received','Return Completed'),(67,9,68,200.00,'Cash on Delivery','Paid','Delivered','2026-09-17 09:51:02',NULL,1,'Delivered','2026-09-17 09:51:02','2026-09-17 09:52:31',NULL,NULL,NULL,NULL),(68,9,68,200.00,'Cash on Delivery','Pending','Shipped','2026-09-18 04:17:25',NULL,1,'Assigned','2026-09-18 04:17:25',NULL,NULL,NULL,NULL,NULL),(69,9,68,120.00,'Cash on Delivery','Pending','Shipped','2026-09-21 07:56:40',NULL,1,'Accepted','2026-09-21 08:30:55',NULL,NULL,NULL,NULL,NULL),(70,9,68,200.00,'Cash on Delivery','Pending','Shipped','2026-09-21 08:57:26',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `image_url` text NOT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_images_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=98 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `order_id` int NOT NULL,
  `rating` int NOT NULL,
  `feedback` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_customer_order_product` (`customer_id`,`order_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
INSERT INTO `product_reviews` VALUES (1,109,9,67,4,'Super','2026-09-17 10:09:42');
/*!40000 ALTER TABLE `product_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `attributes` json NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `discount_price` decimal(10,2) DEFAULT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `sku` varchar(100) DEFAULT NULL,
  `available` tinyint(1) NOT NULL DEFAULT '1',
  `images` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_product_variants_product` (`product_id`),
  CONSTRAINT `fk_product_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `merchant_id` int DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `discount` decimal(5,2) DEFAULT '0.00',
  `stock` int DEFAULT '0',
  `brand` varchar(100) DEFAULT NULL,
  `description` text,
  `image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `size_fit` text,
  `material_care` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=113 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,NULL,'Wireless Headphones','Electronics',2499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(2,NULL,'Smart Watch','Electronics',3299.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(3,NULL,'Running Shoes','Fashion',2199.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(4,NULL,'Classic Backpack','Fashion',1599.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(5,NULL,'Coffee Maker','Home',2799.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(6,NULL,'Sunglasses','Fashion',999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(7,NULL,'Bluetooth Speaker','Electronics',1899.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(8,NULL,'Mechanical Keyboard','Electronics',3499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(9,NULL,'Denim Jacket','Fashion',2499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(10,NULL,'Modern Table Lamp','Home',1299.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(11,NULL,'Wireless Mouse','Electronics',899.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(12,NULL,'Laptop','Electronics',54999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(13,NULL,'Smartphone','Electronics',18999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(14,NULL,'Wireless Earbuds','Electronics',1999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(15,NULL,'Digital Camera','Electronics',32999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(16,NULL,'Gaming Controller','Electronics',2999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(17,NULL,'Portable Speaker','Electronics',1899.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1589003077984-894e133dabab?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(18,NULL,'Webcam','Electronics',2299.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(19,NULL,'Computer Monitor','Electronics',12999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(20,NULL,'Power Bank','Electronics',1799.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1609592424846-3e7d1a7e5c91?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(21,NULL,'Fast Charger','Electronics',799.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(22,NULL,'Wireless Charger','Electronics',999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1609592424846-3e7d1a7e5c91?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(23,NULL,'Tablet','Electronics',14999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(24,NULL,'Laptop Stand','Electronics',1499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1527443195645-1133f7f28990?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(25,NULL,'USB Microphone','Electronics',2999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(26,NULL,'Fitness Tracker','Electronics',2499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1557935728-e6d1eaabe558?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(27,NULL,'Smart LED Bulb','Electronics',699.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(28,NULL,'Portable Projector','Electronics',8999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1535016120720-40c646be5580?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(29,NULL,'External SSD','Electronics',5999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(30,NULL,'Gaming Headset','Electronics',3999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(31,NULL,'Denim Jacket','Fashion',2499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(32,NULL,'Casual T-Shirt','Fashion',899.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(33,NULL,'Formal Shirt','Fashion',1499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(34,NULL,'Hoodie','Fashion',1799.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(35,NULL,'Slim Fit Jeans','Fashion',1999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(36,NULL,'Casual Sneakers','Fashion',2399.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(37,NULL,'Leather Wallet','Fashion',999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(38,NULL,'Leather Belt','Fashion',799.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(39,NULL,'Travel Backpack','Fashion',2299.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(40,NULL,'Sports Cap','Fashion',599.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(41,NULL,'Winter Jacket','Fashion',3499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1544022613-e87ca75a784a?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(42,NULL,'Handbag','Fashion',2499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(43,NULL,'Crossbody Bag','Fashion',1799.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(44,NULL,'Floral Dress','Fashion',2199.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(45,NULL,'Casual Kurti','Fashion',1299.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(46,NULL,'Cotton Saree','Fashion',1999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(47,NULL,'Formal Trousers','Fashion',1699.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(48,NULL,'Sports Shorts','Fashion',899.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(49,NULL,'Leather Boots','Fashion',2999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1542840843-3349799cded6?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(50,NULL,'Canvas Shoes','Fashion',1399.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(51,NULL,'Polo Shirt','Fashion',1199.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(52,NULL,'Oversized T-Shirt','Fashion',999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(53,NULL,'Analog Watch','Fashion',2799.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(54,NULL,'Fashion Scarf','Fashion',699.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1601924928377-1f7c9a5c7f6f?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(55,NULL,'Winter Gloves','Fashion',599.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1458057557595-1e7f3a1e5d4e?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(56,NULL,'Baseball Cap','Fashion',499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(57,NULL,'Travel Duffel Bag','Fashion',1899.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(58,NULL,'Running T-Shirt','Fashion',999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(59,NULL,'Casual Sandals','Fashion',799.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(60,NULL,'Classic Polo','Fashion',1299.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1625910513413-5fc45f9c7c1f?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(61,NULL,'Casual Sneakers','Fashion',2399.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(62,NULL,'Leather Sandals','Fashion',1199.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(63,NULL,'Men\'s Casual Shirt','Fashion',1399.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1602810319428-019690571b5b?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(64,NULL,'Women\'s Casual Top','Fashion',1099.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(65,NULL,'Denim Jeans','Fashion',1899.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(66,NULL,'Women\'s Handbag','Fashion',2299.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(67,NULL,'Round Sunglasses','Fashion',899.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(68,NULL,'Sports Shoes','Fashion',2699.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(69,NULL,'Leather Handbag','Fashion',2999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(70,NULL,'Hooded Sweatshirt','Fashion',1799.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(71,NULL,'Ceramic Vase','Home',999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1581783898377-1c85bf937427?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(72,NULL,'Wall Clock','Home',1199.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(73,NULL,'Decorative Plant','Home',799.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(74,NULL,'Throw Pillow','Home',599.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(75,NULL,'Coffee Table','Home',6999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(76,NULL,'Modern Chair','Home',4999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(77,NULL,'Table Lamp','Home',1299.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(78,NULL,'Ceramic Coffee Mug','Home',499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(79,NULL,'Dinner Plate Set','Home',1299.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1603199506016-b9a594b593c0?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(80,NULL,'Kitchen Utensil Set','Home',1499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(81,NULL,'Non Stick Frying Pan','Home',1599.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1584990347449-a2d4d4f5e0f1?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(82,NULL,'Wooden Cutting Board','Home',699.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(83,NULL,'Kitchen Knife Set','Home',1399.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1593618998160-e34014e67546?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(85,NULL,'Insulated Flask','Home',999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(86,NULL,'Laundry Basket','Home',899.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(87,NULL,'Storage Basket','Home',699.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(88,NULL,'Decorative Candle','Home',499.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(89,NULL,'Photo Frame','Home',599.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(90,NULL,'Wall Art','Home',1199.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(91,NULL,'Bedsheet Set','Home',1599.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(92,NULL,'Soft Blanket','Home',1899.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1580301762395-21ce8e8f2d2c?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(93,NULL,'Decorative Cushion','Home',699.00,NULL,0.00,1,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(94,NULL,'Floor Mat','Home',599.00,NULL,0.00,1,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1600166898405-da9535204843?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(95,NULL,'Curtain Set','Home',1799.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(96,NULL,'Modern Sofa','Home',24999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(97,NULL,'Wooden Dining Table','Home',12999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(98,NULL,'Bedside Table','Home',2999.00,NULL,0.00,0,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(100,NULL,'Decorative Lantern','Home',999.00,NULL,0.00,1,NULL,'Product available at ShopEase.','https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=700&q=80','2026-08-14 05:26:29','approved',NULL,NULL),(101,13,'Athyam Smart Watch','Electronics',2499.00,2999.00,17.00,19,'Athyam','Smart watch with fitness tracking and notifications','https://via.placeholder.com/500','2026-08-20 06:43:37','approved',NULL,NULL),(102,13,'Noise Wireless Earbuds','Electronics',1699.00,1999.00,20.00,33,'Noise','Updated wireless earbuds','https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1','2026-08-20 07:12:12','approved',NULL,NULL),(104,13,'Earring','Fasion',250.00,500.00,50.00,62,'Fashion','','https://www.crunchyfashion.com/cdn/shop/files/RAE2366_D.jpg?v=1720074645','2026-08-31 07:30:57','approved',NULL,NULL),(105,13,'Bindu Athyam','Electronics',2000.00,4000.00,50.00,19,'apple','case','http://localhost:5000/uploads/products/product-1788685971585.jpg','2026-09-06 09:12:51','approved',NULL,NULL),(106,13,'sky wallpaper','Home',10000.00,20000.00,50.00,29,'asian','its an 3d wal paper','http://localhost:5000/uploads/products/product-1788693429028.jpg','2026-09-06 11:17:09','approved',NULL,NULL),(107,13,'idol','Home',200.00,400.00,50.00,21,'poli','its an polymer','http://localhost:5000/uploads/products/product-1788775970942.png','2026-09-07 10:12:50','approved',NULL,NULL),(108,13,'Mouse','Electronic',600.00,1200.00,50.00,10,'Leneo','','','2026-09-10 09:05:13','pending',NULL,NULL),(109,13,'Poster','Fashion',200.00,500.00,55.00,51,'Hello','It\'s an poster','http://127.0.0.1:5000/uploads/products/product-1789109188551.jpeg','2026-09-11 06:46:28','approved',NULL,NULL),(110,23,'Bangles','Fashion',300.00,600.00,50.00,65,'Fasion','Metal','http://127.0.0.1:5000/uploads/products/product-1789642234505.jpeg','2026-09-17 10:50:34','pending','Free','Care'),(111,24,'Bangles','Fashion',50.00,100.00,50.00,66,'Fasion','Glass','http://127.0.0.1:5000/uploads/products/product-1789704937640.jpeg','2026-09-18 04:15:37','pending','Free','Care'),(112,25,'Ring','Fashion',60.00,100.00,40.00,58,'Fashion','An American dimond ring','http://127.0.0.1:5000/uploads/products/product-1789976899404.jpeg','2026-09-21 07:48:19','approved','Free','Metal');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipment_tracking_events`
--

DROP TABLE IF EXISTS `shipment_tracking_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipment_tracking_events` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `shipment_id` int NOT NULL,
  `event_status` varchar(60) NOT NULL,
  `location_type` varchar(30) NOT NULL,
  `hub_id` int DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `notes` text,
  `updated_by_role` varchar(30) NOT NULL,
  `updated_by_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tracking_shipment` (`shipment_id`,`created_at`),
  KEY `idx_tracking_status` (`event_status`),
  KEY `idx_tracking_hub` (`hub_id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipment_tracking_events`
--

LOCK TABLES `shipment_tracking_events` WRITE;
/*!40000 ALTER TABLE `shipment_tracking_events` DISABLE KEYS */;
/*!40000 ALTER TABLE `shipment_tracking_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `business_name` varchar(150) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'customer',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'ShopEase Admin',NULL,'admin@shopease.com','$2b$10$1AA6cOozgIirEoA3vqfmhOzDEVweZpZoX2iAFYgFLSx2Gz8QgYOHm','9876543210','admin','2026-08-13 06:17:22'),(2,'gupta',NULL,'guptaathyam@gmail.com','$2b$10$0y7MxH0dTSOeqhfNSpvHSupg7dGQBFLLoad4JcaMzHROX8ooDz99q',NULL,'customer','2026-08-13 08:02:55'),(3,'gupta',NULL,'binduathyam@gmail.com','$2b$10$/UX/TBMCGai2rb39O9Vc7eQClqFaMc69m6G.JmgNKsMrY4NZdUAlO',NULL,'customer','2026-08-13 08:04:02'),(4,'Athyam',NULL,'deviathyam@gmail.com','$2b$10$47Ha/yyDHUcjfITBEUBtAOXvobDti8iGTvAnJcrhuV6CITyChQJrm','9010626662','customer','2026-08-13 10:11:29'),(5,'Binu',NULL,'poornimaathyam@gmail.com','$2b$10$RVCJDk.8vCMqfv63qjXghuJnQqn31Tsh67OIBSUPwWJVvjorNanoO','9010626662','customer','2026-08-13 10:16:03'),(6,'Bindu',NULL,'manikanta@gmail.com','$2b$10$PWZtuCEuRS.Jg4kh2Njdiu9/FgtnjDyRXH6xvzp2PXiZfRxwssc6S','9010626662','customer','2026-08-13 10:48:29'),(7,'John',NULL,'john@gmail.com','$2b$10$IrADb7STleNaN1/5lWBCBOMWzLsD2eTshNHW.HrV1nMsk2VjUoXga','9010626662','customer','2026-08-13 10:56:25'),(8,'bindu',NULL,'vasuathyam@gmail.com','$2b$10$v.7HS1Xnch4koaF705/ZpeI5W73gJB7xzyWVAErZ1zJ6xihj.j3Dq',NULL,'customer','2026-08-13 12:11:51'),(9,'sai',NULL,'sai@gmail.com','$2b$10$vwgDRHnEX4A7HkCq6j2STu8yf/vH7nd9X7hDarVN7df6MoDwXqr22','9876543210','customer','2026-08-14 06:56:47'),(10,'vasu',NULL,'vasu@gmail.com','$2b$10$hN31SyXdtDIut8FMuY2tSe.DJP8MrDnZ7EBMQzB.pKeoSyo9bi3f.',NULL,'customer','2026-08-14 07:08:21'),(11,'siva',NULL,'siva@gmail.com','$2b$10$e.DMd37Q9jMS9YVr0CkMWunR9.sw0Vsdv0sERoG8BepVQcGWqQ.hm','9949949493','customer','2026-08-17 04:52:12'),(12,'Devi',NULL,'devi@gmail.com','$2b$10$HsHCWW62/sc4opLsBtWNiO2S./5akbFcarwRuuuHn7TbeaJU/xiFe','9000022558','customer','2026-08-17 09:46:03'),(13,'ShopEase Merchant','Athyam Store','merchant@shopease.com','$2b$10$IraBy3PhwJtDCU63PIAByeEDLYniSElG1W1uvpLvPSy0DA3ofND96','9876543210','merchant','2026-08-20 05:46:59'),(14,'priya',NULL,'priya@gmail.com','$2b$10$SqavVKqmI.Yo9coMpEWbEu/BtX9Co0EQyWrxPUey9/5ssP6KceS9W',NULL,'customer','2026-08-20 06:23:06'),(15,'Lalitha','lally stores','lally@gmail.com','$2b$10$HzhfY9db.8SlXTs3VwrbmuatUMUi/73XfBWrkmXMZ6qzQsCRiYgbO','9658477123','merchant','2026-08-21 06:54:44'),(16,'Bindu',NULL,'bindu@gmail.com','$2b$10$0zeLn4OUQdssa8m75xbL1OpSmYcytq3k7MqIGvMzOHaJQgwpsqJy2','9875463210','customer','2026-08-28 11:06:18'),(17,'Bindu',NULL,'cable@gmail.com','$2b$10$PawbYonelxvEsX1FU9cdvOpZ0W3TTy3tvDsmWrLgFJMMtjs9XLIRC','9630852741','customer','2026-08-31 04:30:46'),(18,'Abc',NULL,'abc@gmail.com','$2b$10$t3nLWkFtp9cuWFVsW5VE5OAgnLD/a8DCe.oEwwgS2mC/65KmmiDhm','2580741369','customer','2026-08-31 04:50:09'),(19,'Tester',NULL,'test@gmail.com','$2b$10$aKTu2xDdrcXrDyK4Rhiv4.OUpft423Gz11dXRIJcy36ewudn9ChEe','9630852147','merchant','2026-08-31 05:03:09'),(20,'Kumari',NULL,'kum@gamil.com','$2b$10$zCwLCnyAD7waWwKsAkLdmuPe3InvU9cpue2QHDU4mjiAB/Foqjotq','6325147890','customer','2026-09-16 08:57:38'),(21,'Naga',NULL,'naga@gmail.com','$2b$10$FWAS2H2pQExZGWfaD8weheuwMymDtCVG2KzdYQg0txrES2h/88az2','5842319785','customer','2026-09-16 09:36:22'),(22,'Rep',NULL,'test1@gamil.com','$2b$10$a6O6xBpi8j3Bi1r2legeBuv394c2Rb3i2/PAzteAU.XgxHcw8pEHi','6325147890','merchant','2026-09-17 10:26:15'),(23,'Test',NULL,'test3@gmail.com','$2b$10$/fHHzlPvOQEcmXtVJFOx2OjseLhwXRFZA3G7zYWl4VhPePxz8/cG6','2514786390','merchant','2026-09-17 10:44:24'),(24,'Lucky','Lucky','lucky@gmail.com','$2b$10$g/WS18b5RoMuW5WJK4Wbn.cGkGA9BTLPJxvMBIY2zu3XW0dHlNwGm','9638527410','merchant','2026-09-17 11:49:50'),(25,'Subbu','Subu Store','subu@gmail.com','$2b$10$C58oDNJfUAwlOGPHRG48du4ToxHH91yMKOsTawcc1aGQ4T4Cz5sW.','9632580741','merchant','2026-09-21 07:45:33'),(26,'Lu','Lulu','lu@gmail.com','$2b$10$HjPQf9VbfIjK.cP2RxFRf.dDyueG/wKpkfBTeyte/mIwDOzJ5Ugpa','9658471230','merchant','2026-09-21 09:58:43');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist`
--

DROP TABLE IF EXISTS `wishlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product` (`user_id`,`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist`
--

LOCK TABLES `wishlist` WRITE;
/*!40000 ALTER TABLE `wishlist` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist_items`
--

DROP TABLE IF EXISTS `wishlist_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlist_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `wishlist_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `wishlist_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist_items`
--

LOCK TABLES `wishlist_items` WRITE;
/*!40000 ALTER TABLE `wishlist_items` DISABLE KEYS */;
INSERT INTO `wishlist_items` VALUES (4,11,100,'2026-08-17 05:08:00'),(6,12,100,'2026-08-17 09:52:09'),(8,9,96,'2026-08-17 10:25:53'),(9,9,97,'2026-08-17 10:33:53'),(10,12,98,'2026-08-17 10:46:33'),(12,11,101,'2026-08-31 07:17:39');
/*!40000 ALTER TABLE `wishlist_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'shopease_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-02 13:32:31
