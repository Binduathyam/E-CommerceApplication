/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.5.29-MariaDB, for Linux (x86_64)
--
-- Host: shopease-db.cloks2swqc25.ap-south-1.rds.amazonaws.com    Database: shopease_db
-- ------------------------------------------------------
-- Server version	8.4.9

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
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
/*!40101 SET character_set_client = utf8mb4 */;
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
  `is_default` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `addresses_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES (5,11,'Gupta Athyam','9100432255','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-17 04:54:01',0),(6,11,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-17 05:21:54',0),(7,11,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-17 05:25:28',0),(8,11,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-17 05:26:41',0),(9,9,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-17 05:29:30',0),(10,11,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-17 06:10:43',0),(13,12,'Gdhv','5698442695','Zhjhkdulcnmx','Dulf','Tamil Nadu','656583','2026-08-17 09:50:51',0),(14,12,'Devi','6524478523','Vhfs bdh','Elury','Tamil Nadu','632514','2026-08-17 09:52:39',0),(15,12,'Bindu','9100432255','Main road','Tambaram','Tamil Nadu','600047','2026-08-17 09:58:39',0),(16,12,'Triva','3625147890','Rosd','Eluru','Tamil Nadu','524489','2026-08-17 10:05:45',0),(17,12,'Rishi','6521458795','Market','Chengalpattu','Tamil Nadu','600074','2026-08-17 11:15:58',0),(18,12,'Dh','4598536556','Fucx','Dhvx','Tamil Nadu','569842','2026-08-17 11:29:35',0),(19,12,'Thc','5698595384','Ch.','Xhnv','Tamil Nadu','568832','2026-08-17 11:32:20',0),(20,9,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-18 06:12:09',0),(21,9,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-18 06:20:21',0),(22,9,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-18 06:21:15',0),(23,9,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-18 07:18:50',0),(25,12,'Bindu','9876543210','21, market','Tambaram','Tamilnadu','600074','2026-08-18 08:34:18',0),(26,9,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-25 08:33:10',0),(27,9,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-25 08:33:37',0),(33,11,'Gupta Athyam','9876543210','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-26 05:48:25',0),(34,11,'Gupta Athyam','9010626662','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-26 05:48:58',0),(35,11,'Bindu Athyam','9494005400','14-81 , JAGANNADHAPETA\nPOLAVARAM','WEST GODAVARI','Tamil Nadu','534315','2026-08-26 06:14:18',0),(37,9,'Bindu Athyam','9010626662','25 125 DAARA VARI STREET\nNEW MARKET JANGAREDDIGUDEM','Please Select','Andhra Pradesh','534447','2026-08-26 10:04:20',0),(39,16,'manikanta','9989411266','d no 13,plot no 99, balaji nagar 5th cross street,seliyur','Chennai','Tamil Nadu','600123','2026-08-27 14:28:13',0),(40,17,'lahiri addepalli','9848022233','Thotlavalluru Rd','Vuyyuru','Tamil Nadu','521165','2026-08-27 15:58:50',0),(41,17,'lahiri addepalli','9848022233','Thotlavalluru Rd','Vuyyuru','Tamil Nadu','521165','2026-08-27 15:59:10',0),(42,16,'Manikanta','9989411266','Balaji nagar 5th cross street','Chennai','Tamil Nadu','600123','2026-08-28 04:09:42',0),(43,16,'Gupta Athyam','9989411266','Chennai-Bengaluru Highway Palanjur Sembarambakkam','Chennai','Tamil Nadu','600123','2026-08-28 08:38:05',0),(45,18,'Harshith','8688982476','Plot no 100 balaji nagar 5th cross street','Chennai','Tamil Nadu','600073','2026-08-28 18:11:27',0),(47,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-08 14:10:31',0),(48,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 04:43:26',0),(49,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 04:43:54',0),(50,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 04:44:07',0),(51,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 04:45:02',0),(52,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 04:45:03',0),(53,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 05:08:44',0),(54,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 05:09:02',0),(55,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 05:15:47',0),(56,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 05:16:31',0),(57,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 05:28:02',0),(58,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 05:28:10',0),(59,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 05:30:36',0),(60,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-09 05:31:00',0),(63,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-16 11:41:07',0),(64,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-17 07:14:56',0),(65,9,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-17 07:16:30',1),(67,19,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-18 04:24:11',0),(68,19,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-18 07:43:56',0),(69,19,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-18 07:44:13',0),(70,19,'Bindu Athyam','9494005400','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-18 07:54:49',0),(71,19,'sai','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-18 08:39:50',0),(72,19,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-18 09:50:39',0),(73,19,'gani','9494005400','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-18 10:37:31',0),(74,19,'Bindu Athyam','9494005400','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-18 11:31:12',0),(75,19,'Bindu Athyam','9010626662','25-125 ,DAARA VARI STREET\nNEW MARKET , JANGA REDDY GUDEM','Jangareddygudem','Andhra Pradesh','534447','2026-09-19 13:54:25',0),(76,19,'Bindu Athyam','9010626662','25-125 ,DAARA VARI STREET\nNEW MARKET , JANGA REDDY GUDEM','Jangareddygudem','Andhra Pradesh','534447','2026-09-19 14:20:42',0),(77,19,'Bindu Athyam','9010626662','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-19 14:21:16',0),(78,19,'lally','9494005400','14-81 , JAGANNADHAPETA\nPOLAVARAM','Jangareddygudem','Andhra Pradesh','534315','2026-09-21 06:49:40',0),(79,19,'Bindu Athyam','9494005400','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','2026-09-28 08:27:06',0),(80,24,'Lahiri','7569203603','Vijayawada','Vijayawada','Andhra Pradesh','520012','2026-09-29 11:29:06',0),(81,24,'Lahiri','7569203603','Vijayawada','Vijayawada','Andhra Pradesh','520012','2026-09-29 11:30:30',0),(82,19,'Bindu Athyam','9010626662','25-125 ,DAARA VARI STREET\nNEW MARKET , JANGA REDDY GUDEM','WEST GODAVARI','Andhra Pradesh','534447','2026-10-30 07:56:57',1);
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_product_ratings`
--

DROP TABLE IF EXISTS `admin_product_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_product_ratings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `admin_id` int NOT NULL,
  `rating` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_admin_product` (`product_id`,`admin_id`),
  CONSTRAINT `admin_product_ratings_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
/*!40101 SET character_set_client = utf8mb4 */;
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
INSERT INTO `banners` VALUES (1,'summer sale','ecerything u need at amazing price','30','Shop Now','/uploads/banners/banner-1791180525074.jpg',0,'2026-10-05 06:08:45','2026-10-20 08:03:49'),(2,'summer sale','everything you need you will get at amazing prices','30 %','Shop Now','/uploads/banners/banner-1792483429536.png',1,'2026-10-20 08:03:49','2026-10-20 08:03:49');
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `gst_rate` decimal(5,2) NOT NULL DEFAULT '0.00',
  `selected_size` varchar(100) DEFAULT NULL,
  `variant_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_product` (`user_id`,`product_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `cart_items_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cart_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=206 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `delivery_partner_id` int NOT NULL,
  `order_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_notifications`
--

LOCK TABLES `delivery_notifications` WRITE;
/*!40000 ALTER TABLE `delivery_notifications` DISABLE KEYS */;
INSERT INTO `delivery_notifications` VALUES (1,1,50,'New Order Assigned','A new order #50 has been assigned to you',0,'2026-09-09 05:30:36'),(2,1,24,'New Order Assigned','A new order #24 has been assigned to you',0,'2026-09-09 05:32:09'),(3,1,26,'New Order Assigned','A new order #26 has been assigned to you',0,'2026-09-09 05:32:09'),(4,1,51,'New Order Assigned','A new order #51 has been assigned to you',0,'2026-09-09 05:32:09'),(5,1,50,'Return Request','Return requested for order #50',0,'2026-09-09 05:35:07'),(6,1,41,'Return Request','Return requested for order #41',0,'2026-09-10 10:28:16'),(7,1,43,'Return Request','Return requested for order #43',0,'2026-09-10 11:04:39'),(8,1,52,'New Order Assigned','A new order #52 has been assigned to you',0,'2026-09-15 07:11:46'),(9,1,52,'Return Request','Return requested for order #52',0,'2026-09-15 07:34:45'),(10,1,53,'New Order Assigned','A new order #53 has been assigned to you',0,'2026-09-16 11:24:13'),(11,1,55,'New Order Assigned','A new order #55 has been assigned to you',0,'2026-09-17 07:14:56'),(12,1,56,'New Order Assigned','A new order #56 has been assigned to you',0,'2026-09-17 07:16:31'),(13,1,57,'New Order Assigned','A new order #57 has been assigned to you',0,'2026-09-17 08:24:54'),(14,1,58,'New Order Assigned','A new order #58 has been assigned to you',0,'2026-09-18 05:46:39'),(15,1,59,'New Order Assigned','A new order #59 has been assigned to you',0,'2026-09-18 07:43:56'),(16,3,60,'Return Request','Return requested for order #60',0,'2026-09-18 07:54:13'),(17,1,64,'New Order Assigned','A new order #64 has been assigned to you',0,'2026-09-19 16:51:00'),(18,1,68,'New Order Assigned','A new order #68 has been assigned to you',0,'2026-09-21 06:15:29'),(19,8,123,'Return Request','Return requested for order #123',0,'2026-10-30 10:00:20'),(20,8,124,'New Order Assigned','A new order #124 has been assigned to you',0,'2026-10-30 11:29:00');
/*!40000 ALTER TABLE `delivery_notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_partner_earnings`
--

DROP TABLE IF EXISTS `delivery_partner_earnings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_partner_earnings`
--

LOCK TABLES `delivery_partner_earnings` WRITE;
/*!40000 ALTER TABLE `delivery_partner_earnings` DISABLE KEYS */;
INSERT INTO `delivery_partner_earnings` VALUES (1,1,52,50.00,'Delivery','2026-09-15 07:32:59'),(2,1,53,50.00,'Delivery','2026-09-16 11:24:54'),(3,1,54,50.00,'Delivery','2026-09-17 04:56:14'),(4,1,55,50.00,'Delivery','2026-09-17 07:15:24'),(5,1,56,50.00,'Delivery','2026-09-17 07:16:50'),(6,3,60,50.00,'Delivery','2026-09-18 07:52:32'),(7,5,69,50.00,'Delivery','2026-09-21 06:57:27'),(8,1,72,50.00,'Delivery','2026-09-22 05:18:01'),(9,1,73,50.00,'Delivery','2026-09-28 08:28:13'),(10,1,115,50.00,'Delivery','2026-10-19 09:27:24'),(11,1,117,50.00,'Delivery','2026-10-26 11:21:24'),(12,1,121,50.00,'Delivery','2026-10-27 12:32:17'),(13,3,122,50.00,'Delivery','2026-10-30 09:04:22'),(14,8,123,50.00,'Delivery','2026-10-30 09:58:23'),(15,8,123,50.00,'Return','2026-10-30 10:02:52'),(16,1,65,50.00,'Delivery','2026-10-30 11:19:27'),(17,1,51,50.00,'Delivery','2026-10-30 11:19:28'),(18,1,42,50.00,'Delivery','2026-10-30 11:19:29'),(19,8,125,50.00,'Delivery','2026-10-30 11:29:46'),(20,1,129,50.00,'Delivery','2026-11-01 13:12:27');
/*!40000 ALTER TABLE `delivery_partner_earnings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_partners`
--

DROP TABLE IF EXISTS `delivery_partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `delivery_partners` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `password` varchar(255) NOT NULL,
  `address` text,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `vehicle_type` varchar(50) DEFAULT NULL,
  `vehicle_number` varchar(50) DEFAULT NULL,
  `license_number` varchar(100) DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `availability_status` varchar(30) DEFAULT 'Offline',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  `security_question` varchar(255) DEFAULT NULL,
  `security_answer` varchar(255) DEFAULT NULL,
  `license_image` text,
  `approval_status` varchar(20) NOT NULL DEFAULT 'Approved',
  `approval_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_partners`
--

LOCK TABLES `delivery_partners` WRITE;
/*!40000 ALTER TABLE `delivery_partners` DISABLE KEYS */;
INSERT INTO `delivery_partners` VALUES (1,'Bindu Athyam','athyam@gmail.com','+919010626662','$2b$10$uzsbqMHqWSd.xrqLjgfSVuLu4RUSOIR63yLeI/wfhI4OSnnpIdBni','chennai tamilnadu','Chennai','Tamil Nadu','car','TN10AB1456','u84815848745','active','Online','2026-09-08 11:54:21',NULL,NULL,NULL,NULL,NULL,'Approved',NULL),(2,'Bindu Athyam','sailakshmiprasanna@gmail.com','+919010626662','$2b$10$GRUwHF8To6ZZrGKzLfYgxePPKGDeC.Kv.4CtMiZFmdxL3wJ.ROqsS','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai',NULL,'Scooter','TN10AB1456','u84815848745','active','Online','2026-09-18 04:22:42',NULL,NULL,NULL,NULL,NULL,'Approved',NULL),(3,'ganesh','ganesh@gmail.com','5214789630','$2b$10$jziO2U0yUF5XKocliGJ4heTZ1TnvGDE/sallobLqoEYcZkF2JE2qe','Selaiyur, Tambaram','Chennai','Tamil Nadu','Car','TN10AB1456','u84815848745','active','Busy','2026-09-18 06:22:08',NULL,NULL,NULL,NULL,NULL,'Approved',NULL),(4,'bharath','bharath@gmail.com','+919494005400','$2b$10$nW3KSisVU8TJlLqKbEeZAudISfQSReVQTzWknMNGH/x3k75yY6BN6','mambalam','Chennai','Tamil Nadu','Van','TN10AB1456','u84815848745','active','Online','2026-09-21 06:26:47',NULL,NULL,NULL,NULL,NULL,'Approved',NULL),(5,'kavya','kavya@gmail.com','+919494005400','$2b$10$q.2CWP0cG08TBC0eKICrkeZGrjGXCkZx1bPcdzjBRNhLt1q/2q1Fe','25-125 ,DAARA VARI STREET\nNEW MARKET , JANGA REDDY GUDEM','Jangareddygudem','Andhra Pradesh','Scooter','TN10AB1456','u84815848745','active','Online','2026-09-21 06:55:43',NULL,NULL,NULL,NULL,NULL,'Approved',NULL),(6,'hari','hari@gmail.com','5478963210','$2b$10$Ulsz7BbL4afgw1DTcix/MOPU1DPxlgsU3/qq2w8ldsVhdSNy7Kfzm','Bharath Institute of Higher Education and Research\r\nSelaiyur, Tambaram','Chennai','Tamil Nadu','Scooter','TN10AB1456','u84815848745','active','Online','2026-09-29 06:15:12',NULL,NULL,'What is your favourite food?','rice','/uploads/delivery-documents/1790662512278-115958720.jpg','Approved','2026-09-29 06:16:52'),(7,'Bindu Athyam','binduathyam@gmail.com','+919010626662','$2b$10$3kn7HaNOu/kxTDmucXjK5.H48I027AOTh7knpcSuWIBOHset7uMY6','25-125 ,DAARA VARI STREET\r\nNEW MARKET , JANGA REDDY GUDEM','WEST GODAVARI','Andhra Pradesh','Van','TN10AB1456','u84815848745','active','Offline','2026-10-30 07:17:43',NULL,NULL,'What was the name of your first pet?','dog','/uploads/delivery-documents/1793344662988-78059555.jpg','Approved','2026-10-30 07:19:28'),(8,'Bindu Athyam','tivanalavyshnavi@gmail.com','+919494005400','$2b$10$TX1oksfCm02K2MF/GBjtsuyro6bEMulqfxXHdewdnJsqqCeXf.A/.','14-81 , JAGANNADHAPETA\r\nPOLAVARAM','WEST GODAVARI','Andhra Pradesh','Van','TN10AB1456','u84815848745','active','Online','2026-10-30 09:56:56',NULL,NULL,'What was the name of your first pet?','dpg','/uploads/delivery-documents/1793354216645-50238073.jpg','Approved','2026-10-30 09:57:19');
/*!40000 ALTER TABLE `delivery_partners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispatch_hubs`
--

DROP TABLE IF EXISTS `dispatch_hubs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
INSERT INTO `dispatch_hubs` VALUES (1,'CHN-MAIN-01','Chennai Main Hub','Chennai Logistics Hub','Chennai','Tamil Nadu','600001','Active','2026-10-29 09:24:40'),(4,'JRG-MAIN-01','JRG hub','25-125 ,DAARA VARI STREET','WEST GODAVARI','Andhra Pradesh','534447','Active','2026-10-30 05:39:16'),(5,'jrg2','jrg','14-81 , JAGANNADHAPETA','jangareddygudem','Andhra Pradesh','534315','Active','2026-10-30 08:05:21');
/*!40000 ALTER TABLE `dispatch_hubs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hub_transfers`
--

DROP TABLE IF EXISTS `hub_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
INSERT INTO `hub_transfers` VALUES (1,2,1,5,'Arrived',NULL,'2026-10-30 09:53:38','2026-10-30 09:53:38','2026-10-30 09:53:46'),(2,3,1,4,'Arrived',NULL,'2026-10-30 11:20:35','2026-10-30 11:20:35','2026-10-30 11:20:39'),(3,4,1,4,'Arrived',NULL,'2026-10-30 11:40:13','2026-10-30 11:40:13','2026-10-30 11:40:17'),(4,7,1,4,'In Transit',NULL,'2026-11-01 13:11:42','2026-11-01 13:11:42',NULL),(5,5,1,4,'In Transit',NULL,'2026-11-01 13:11:45','2026-11-01 13:11:45',NULL);
/*!40000 ALTER TABLE `hub_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `merchant_shipments`
--

DROP TABLE IF EXISTS `merchant_shipments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
INSERT INTO `merchant_shipments` VALUES (1,122,14,1,'Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','Received at Origin Hub','2026-10-30 07:45:32','2026-10-30 07:45:32','2026-10-30 07:47:26','2026-10-30 07:47:36',NULL,'SHP-122-14-FDC1245C4D94',1,1,1,1,NULL),(2,123,14,3,'Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','Arrived at Destination Hub','2026-10-30 08:52:03','2026-10-30 08:52:03','2026-10-30 09:52:52','2026-10-30 09:52:55',NULL,'SHP-123-14-0492A0ED200E',1,5,5,3,NULL),(3,124,14,1,'Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','Arrived at Destination Hub','2026-10-30 10:52:09','2026-10-30 10:52:09','2026-10-30 11:20:14','2026-10-30 11:20:16',NULL,'SHP-124-14-30B94AD3CFD7',1,4,4,1,NULL),(4,127,14,1,'Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','Arrived at Destination Hub','2026-10-30 11:32:40','2026-10-30 11:32:40','2026-10-30 11:39:40','2026-10-30 11:39:46',NULL,'SHP-127-14-CB6B4E46CB50',1,4,4,1,NULL),(5,128,14,1,'Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','In Transit','2026-10-30 11:39:27','2026-10-30 11:39:27','2026-10-30 11:40:38','2026-10-30 11:40:41',NULL,'SHP-128-14-9A6AEAECCD2D',1,4,1,1,NULL),(6,129,14,1,'Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','Received at Origin Hub','2026-11-01 07:57:14','2026-11-01 07:57:14','2026-11-01 07:58:15','2026-11-01 07:58:17',NULL,'SHP-129-14-E07C9E13AFA0',1,1,1,1,NULL),(7,130,14,1,'Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073','In Transit','2026-11-01 13:09:41','2026-11-01 13:09:41','2026-11-01 13:11:09','2026-11-01 13:11:10',NULL,'SHP-130-14-D55F4B89855E',1,4,1,1,NULL);
/*!40000 ALTER TABLE `merchant_shipments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `variant_id` int DEFAULT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=129 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (94,81,121,NULL,2,369.00),(95,82,120,NULL,1,369.00),(96,95,122,21,1,489.00),(97,102,122,NULL,1,489.00),(98,111,122,22,1,489.00),(99,112,122,22,1,489.00),(101,114,122,22,1,489.00),(102,115,122,21,2,489.00),(103,116,122,21,2,489.00),(104,117,123,25,1,13799.00),(105,117,121,18,1,369.00),(106,117,122,21,1,489.00),(107,118,120,NULL,2,369.00),(108,118,123,25,1,13799.00),(109,118,121,18,1,369.00),(110,118,122,21,1,489.00),(111,119,120,NULL,2,369.00),(112,119,123,25,1,13799.00),(113,119,121,18,1,369.00),(114,120,120,NULL,2,369.00),(115,120,123,25,1,13799.00),(116,120,121,18,1,369.00),(117,121,139,35,1,399.00),(118,122,141,38,1,649.00),(119,123,137,NULL,1,579.00),(120,124,130,29,1,328999.00),(121,125,135,31,1,192.00),(124,127,132,NULL,1,219.00),(125,127,135,31,1,192.00),(126,128,133,NULL,1,290.00),(127,129,139,35,1,399.00),(128,130,128,NULL,1,1599.00);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `address_id` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `payment_status` varchar(50) DEFAULT 'Pending',
  `order_status` varchar(50) DEFAULT 'Placed',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `shipping_address` text,
  `delivery_partner_id` int DEFAULT NULL,
  `delivery_status` varchar(50) DEFAULT 'Not Assigned',
  `assigned_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `return_status` varchar(50) DEFAULT NULL,
  `return_reason` text,
  `return_requested_at` timestamp NULL DEFAULT NULL,
  `cancellation_reason` text,
  `latitude` decimal(10,7) DEFAULT NULL,
  `longitude` decimal(10,7) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `address_id` (`address_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=131 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (2,11,5,3608.00,'cod','Pending','Placed','2026-08-17 04:54:01',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,11,6,26208.00,'cod','Pending','Placed','2026-08-17 05:21:54',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(4,11,7,1308.00,'cod','Pending','Placed','2026-08-17 05:25:28',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,11,8,1608.00,'cod','Pending','Cancelled','2026-08-17 05:26:41',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(6,9,9,1608.00,'cod','Pending','Placed','2026-08-17 05:29:30',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(7,11,10,38008.00,'cod','Pending','Placed','2026-08-17 06:10:43',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(10,12,13,599.00,'Cash on Delivery','Pending','Placed','2026-08-17 09:50:51',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(11,12,14,12999.00,'Cash on Delivery','Pending','Placed','2026-08-17 09:52:39',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(12,12,15,599.00,'Cash on Delivery','Pending','Placed','2026-08-17 09:58:39',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(13,12,16,12999.00,'Cash on Delivery','Pending','Placed','2026-08-17 10:05:45',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(14,12,17,3395.00,'Cash on Delivery','Pending','Placed','2026-08-17 11:15:58',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(15,12,18,1198.00,'Cash on Delivery','Pending','Placed','2026-08-17 11:29:35',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(16,12,19,599.00,'Cash on Delivery','Pending','Placed','2026-08-17 11:32:20',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(17,9,20,549.00,'upi','Pending','Placed','2026-08-18 06:12:09',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(18,9,21,649.00,'Cash on Delivery','Pending','Placed','2026-08-18 06:20:21',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(19,9,22,1809.00,'Razorpay','Paid','Placed','2026-08-18 06:39:27',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(20,9,23,1009.00,'Razorpay','Paid','Placed','2026-08-18 07:20:28',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(22,9,23,999.00,'Razorpay','Paid','Placed','2026-08-18 10:02:07',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(23,9,26,1809.00,'Cash on Delivery','Pending','Placed','2026-08-25 08:33:10',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(24,9,27,1809.00,'Razorpay','Paid','Delivered','2026-08-25 08:34:03',NULL,1,'Delivered','2026-09-09 05:32:09','2026-09-09 05:32:31',NULL,NULL,NULL,NULL,NULL,NULL),(29,11,34,1009.00,'Cash on Delivery','Pending','Placed','2026-08-26 05:49:01',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(30,11,35,1009.00,'Razorpay','Paid','Confirmed','2026-08-26 06:14:43',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(32,9,37,300.00,'Razorpay','Paid','Placed','2026-08-26 10:04:42',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(33,16,39,2058.00,'Razorpay','Paid','Placed','2026-08-27 14:29:47',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(36,16,42,550.00,'Razorpay','Paid','Placed','2026-08-28 04:10:33',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(37,16,43,300.00,'Razorpay','Paid','Placed','2026-08-28 08:38:32',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(39,18,45,300.00,'Razorpay','Paid','Placed','2026-08-28 18:12:04',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(41,9,47,1509.00,'Razorpay','Paid','Delivered','2026-09-08 14:10:56',NULL,1,'Delivered','2026-09-08 14:19:41','2026-09-09 05:32:12','Return Completed','Product quality is not good','2026-09-10 10:28:16',NULL,NULL,NULL),(42,9,50,300.00,'Razorpay','Paid','Delivered','2026-09-09 04:44:31',NULL,1,'Delivered','2026-09-09 04:45:45','2026-10-30 11:19:29',NULL,NULL,NULL,NULL,NULL,NULL),(43,9,52,1809.00,'Razorpay','Paid','Delivered','2026-09-09 04:45:28',NULL,1,'Delivered','2026-09-09 04:45:42','2026-09-09 05:32:09','Return Completed','Product quality is not good','2026-09-10 11:04:39',NULL,NULL,NULL),(50,9,59,3009.00,'Cash on Delivery','Paid','Delivered','2026-09-09 05:30:36',NULL,1,'Delivered','2026-09-09 05:30:36','2026-09-09 05:34:22','Return Completed','Product does not match description','2026-09-09 05:35:07',NULL,NULL,NULL),(51,9,60,1209.00,'Cash on Delivery','Paid','Delivered','2026-09-09 05:31:00',NULL,1,'Delivered','2026-09-09 05:32:09','2026-10-30 11:19:28',NULL,NULL,NULL,NULL,NULL,NULL),(54,9,63,849.00,'Razorpay','Paid','Delivered','2026-09-16 11:41:37',NULL,1,'Delivered','2026-09-17 04:55:57','2026-09-17 04:56:14',NULL,NULL,NULL,NULL,NULL,NULL),(55,9,64,13259.00,'Cash on Delivery','Paid','Delivered','2026-09-17 07:14:56',NULL,1,'Delivered','2026-09-17 07:14:56','2026-09-17 07:15:24',NULL,NULL,NULL,NULL,NULL,NULL),(56,9,65,14358.00,'Cash on Delivery','Paid','Delivered','2026-09-17 07:16:31',NULL,1,'Delivered','2026-09-17 07:16:31','2026-09-17 07:16:50',NULL,NULL,NULL,NULL,NULL,NULL),(58,19,67,500.00,'Cash on Delivery','Pending','Shipped','2026-09-18 04:24:11',NULL,1,'Assigned','2026-09-18 05:46:39',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(59,19,68,300.00,'Cash on Delivery','Pending','Placed','2026-09-18 07:43:56',NULL,1,'Assigned','2026-09-18 07:43:56',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(60,19,69,300.00,'Razorpay','Paid','Delivered','2026-09-18 07:44:46',NULL,3,'Delivered','2026-09-18 07:44:46','2026-09-18 07:52:32','Requested','Product quality is not good','2026-09-18 07:54:13',NULL,NULL,NULL),(61,19,70,300.00,'Razorpay','Paid','Shipped','2026-09-18 07:55:10',NULL,3,'Assigned','2026-09-18 07:55:10',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(62,19,71,550.00,'Razorpay','Paid','Shipped','2026-09-18 08:40:12',NULL,1,'Assigned','2026-09-18 08:40:26',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(63,19,72,550.00,'Razorpay','Paid','Shipped','2026-09-18 09:51:06',NULL,1,'Assigned','2026-09-18 09:51:26',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(64,19,73,300.00,'Razorpay','Paid','Shipped','2026-09-18 10:37:56',NULL,1,'Assigned','2026-09-19 16:51:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(65,19,74,300.00,'Razorpay','Paid','Delivered','2026-09-18 11:31:39',NULL,1,'Delivered','2026-09-19 13:50:33','2026-10-30 11:19:27',NULL,NULL,NULL,NULL,NULL,NULL),(66,19,75,250.00,'Cash on Delivery','Pending','Shipped','2026-09-19 13:54:25',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(67,19,76,550.00,'Cash on Delivery','Pending','Shipped','2026-09-19 14:20:42',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(68,19,77,250.00,'Cash on Delivery','Pending','Shipped','2026-09-19 14:21:16',NULL,1,'Assigned','2026-09-21 06:15:29',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(69,19,78,100.00,'Cash on Delivery','Paid','Delivered','2026-09-21 06:49:41',NULL,5,'Delivered','2026-09-21 06:56:58','2026-09-21 06:57:27',NULL,NULL,NULL,NULL,NULL,NULL),(71,9,65,100.00,'Razorpay','Paid','Placed','2026-09-22 05:07:51',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(72,9,65,500.00,'Cash on Delivery','Paid','Delivered','2026-09-22 05:16:00',NULL,1,'Delivered','2026-09-22 05:17:46','2026-09-22 05:18:01',NULL,NULL,NULL,NULL,NULL,NULL),(73,19,79,600.00,'Cash on Delivery','Paid','Delivered','2026-09-28 08:27:06',NULL,1,'Delivered','2026-09-28 08:28:04','2026-09-28 08:28:13',NULL,NULL,NULL,NULL,NULL,NULL),(74,24,81,4059.00,'Cash on Delivery','Pending','Placed','2026-09-29 11:30:30',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(81,19,79,824.90,'Cash on Delivery','Pending','Placed','2026-10-18 07:55:38',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(82,19,79,437.45,'Cash on Delivery','Pending','Placed','2026-10-18 07:56:34',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(95,19,79,563.45,'Cash on Delivery','Pending','Placed','2026-10-18 12:40:50',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(102,19,79,563.45,'Razorpay','Paid','Placed','2026-10-19 03:57:15',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(111,19,79,563.45,'Cash on Delivery','Pending','Placed','2026-10-19 07:14:05',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(112,19,79,563.45,'Cash on Delivery','Pending','Placed','2026-10-19 08:06:50',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(113,19,79,250.00,'Cash on Delivery','Pending','Placed','2026-10-19 08:18:28',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(114,19,79,563.45,'Cash on Delivery','Pending','Placed','2026-10-19 08:57:51',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(115,19,79,1076.90,'Cash on Delivery','Paid','Delivered','2026-10-19 08:58:11',NULL,1,'Delivered','2026-10-19 09:27:07','2026-10-19 09:27:24',NULL,NULL,NULL,NULL,NULL,NULL),(116,9,65,1076.90,'Cash on Delivery','Pending','Placed','2026-10-21 12:18:40',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(117,19,79,17193.72,'Cash on Delivery','Paid','Delivered','2026-10-26 11:19:28',NULL,1,'Delivered','2026-10-26 11:21:11','2026-10-26 11:21:24',NULL,NULL,NULL,NULL,NULL,NULL),(118,19,79,17968.62,'Cash on Delivery','Pending','Placed','2026-10-26 12:32:53',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(119,19,79,17455.17,'Cash on Delivery','Pending','Placed','2026-10-26 12:33:47',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(120,19,79,17455.17,'Cash on Delivery','Pending','Shipped','2026-10-27 11:06:35',NULL,3,'Accepted','2026-10-30 09:04:08',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(121,19,79,468.95,'Cash on Delivery','Paid','Delivered','2026-10-27 12:31:28',NULL,1,'Delivered','2026-10-27 12:32:10','2026-10-27 12:32:17',NULL,NULL,NULL,NULL,NULL,NULL),(122,19,79,815.82,'Cash on Delivery','Paid','Delivered','2026-10-30 07:24:23',NULL,3,'Delivered','2026-10-30 09:04:04','2026-10-30 09:04:22',NULL,NULL,NULL,NULL,NULL,NULL),(123,19,78,629.00,'Cash on Delivery','Paid','Delivered','2026-10-30 07:46:31',NULL,8,'Delivered','2026-10-30 09:57:53','2026-10-30 09:58:23','Return Completed','Wrong product received','2026-10-30 10:00:20',NULL,NULL,NULL),(124,19,82,388228.82,'Cash on Delivery','Pending','Shipped','2026-10-30 07:57:22',NULL,8,'Assigned','2026-10-30 11:29:00',NULL,NULL,NULL,NULL,NULL,NULL,NULL),(125,19,82,251.60,'Cash on Delivery','Paid','Delivered','2026-10-30 10:32:03',NULL,8,'Delivered','2026-10-30 11:29:31','2026-10-30 11:29:46',NULL,NULL,NULL,NULL,NULL,NULL),(127,19,82,470.60,'Cash on Delivery','Pending','Shipped','2026-10-30 11:31:58',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(128,19,82,340.00,'Cash on Delivery','Pending','Shipped','2026-10-30 11:39:15',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(129,19,79,468.95,'Cash on Delivery','Paid','Delivered','2026-11-01 07:57:01',NULL,1,'Delivered','2026-11-01 13:12:10','2026-11-01 13:12:27',NULL,NULL,NULL,NULL,NULL,NULL),(130,19,82,1609.00,'Cash on Delivery','Pending','Shipped','2026-11-01 13:09:30',NULL,NULL,'Not Assigned',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
INSERT INTO `product_images` VALUES (21,120,'http://3.110.90.184/uploads/products/product-1792047938751.png',0,1,'2026-10-15 07:05:43'),(22,120,'http://3.110.90.184/uploads/products/product-1792047940810.png',1,0,'2026-10-15 07:05:43'),(23,120,'http://3.110.90.184/uploads/products/product-1792047942046.png',2,0,'2026-10-15 07:05:43'),(24,120,'http://3.110.90.184/uploads/products/product-1792047943060.png',3,0,'2026-10-15 07:05:43'),(25,121,'http://3.110.90.184/uploads/products/product-1792062958664.png',0,1,'2026-10-15 11:15:59'),(26,121,'http://3.110.90.184/uploads/products/product-1792062959145.png',1,0,'2026-10-15 11:15:59'),(27,121,'http://3.110.90.184/uploads/products/product-1792062959848.png',2,0,'2026-10-15 11:15:59'),(28,122,'http://3.110.90.184/uploads/products/product-1792311132911.png',0,1,'2026-10-18 08:12:14'),(29,122,'http://3.110.90.184/uploads/products/product-1792311133515.png',1,0,'2026-10-18 08:12:14'),(30,122,'http://3.110.90.184/uploads/products/product-1792311134084.png',2,0,'2026-10-18 08:12:14'),(31,123,'http://3.110.90.184/uploads/products/product-1792408195038.png',0,1,'2026-10-19 11:09:56'),(32,123,'http://3.110.90.184/uploads/products/product-1792408195809.png',1,0,'2026-10-19 11:09:56'),(33,123,'http://3.110.90.184/uploads/products/product-1792408196233.png',2,0,'2026-10-19 11:09:56'),(34,123,'http://3.110.90.184/uploads/products/product-1792408196569.png',3,0,'2026-10-19 11:09:56'),(35,124,'http://3.110.90.184/uploads/products/product-1792647017988.png',0,1,'2026-10-22 05:30:19'),(36,124,'http://3.110.90.184/uploads/products/product-1792647018522.png',1,0,'2026-10-22 05:30:19'),(37,124,'http://3.110.90.184/uploads/products/product-1792647019235.png',2,0,'2026-10-22 05:30:19'),(38,125,'http://3.110.90.184/uploads/products/product-1792647389288.png',0,1,'2026-10-22 05:36:32'),(39,125,'http://3.110.90.184/uploads/products/product-1792647390303.png',1,0,'2026-10-22 05:36:32'),(40,125,'http://3.110.90.184/uploads/products/product-1792647390966.png',2,0,'2026-10-22 05:36:32'),(41,125,'http://3.110.90.184/uploads/products/product-1792647391960.png',3,0,'2026-10-22 05:36:32'),(42,126,'http://3.110.90.184/uploads/products/product-1792649227340.png',0,1,'2026-10-22 06:07:09'),(43,126,'http://3.110.90.184/uploads/products/product-1792649228413.png',1,0,'2026-10-22 06:07:09'),(44,126,'http://3.110.90.184/uploads/products/product-1792649229187.png',2,0,'2026-10-22 06:07:09'),(45,127,'http://3.110.90.184/uploads/products/product-1792649752324.png',0,1,'2026-10-22 06:15:54'),(46,127,'http://3.110.90.184/uploads/products/product-1792649752866.png',1,0,'2026-10-22 06:15:54'),(47,127,'http://3.110.90.184/uploads/products/product-1792649753655.png',2,0,'2026-10-22 06:15:54'),(48,127,'http://3.110.90.184/uploads/products/product-1792649754259.png',3,0,'2026-10-22 06:15:54'),(49,128,'http://3.110.90.184/uploads/products/product-1792652682358.png',0,1,'2026-10-22 07:04:43'),(50,128,'http://3.110.90.184/uploads/products/product-1792652683014.png',1,0,'2026-10-22 07:04:43'),(51,128,'http://3.110.90.184/uploads/products/product-1792652683602.png',2,0,'2026-10-22 07:04:43'),(52,129,'http://3.110.90.184/uploads/products/product-1792653026656.png',0,1,'2026-10-22 07:10:28'),(53,129,'http://3.110.90.184/uploads/products/product-1792653027583.png',1,0,'2026-10-22 07:10:28'),(54,129,'http://3.110.90.184/uploads/products/product-1792653027985.png',2,0,'2026-10-22 07:10:28'),(55,129,'http://3.110.90.184/uploads/products/product-1792653028694.png',3,0,'2026-10-22 07:10:28'),(56,130,'http://3.110.90.184/uploads/products/product-1792653193322.png',0,1,'2026-10-22 07:13:21'),(57,130,'http://3.110.90.184/uploads/products/product-1792653197067.png',1,0,'2026-10-22 07:13:21'),(58,130,'http://3.110.90.184/uploads/products/product-1792653197937.png',2,0,'2026-10-22 07:13:21'),(59,130,'http://3.110.90.184/uploads/products/product-1792653200897.png',3,0,'2026-10-22 07:13:21'),(60,131,'http://3.110.90.184/uploads/products/product-1792653313238.png',0,1,'2026-10-22 07:15:17'),(61,131,'http://3.110.90.184/uploads/products/product-1792653315198.png',1,0,'2026-10-22 07:15:17'),(62,131,'http://3.110.90.184/uploads/products/product-1792653317638.png',2,0,'2026-10-22 07:15:17'),(63,132,'http://3.110.90.184/uploads/products/product-1792653616430.png',0,1,'2026-10-22 07:20:18'),(64,132,'http://3.110.90.184/uploads/products/product-1792653617837.png',1,0,'2026-10-22 07:20:19'),(65,132,'http://3.110.90.184/uploads/products/product-1792653618919.png',2,0,'2026-10-22 07:20:19'),(66,133,'http://3.110.90.184/uploads/products/product-1792653910575.png',0,1,'2026-10-22 07:25:11'),(67,133,'http://3.110.90.184/uploads/products/product-1792653910811.png',1,0,'2026-10-22 07:25:11'),(68,133,'http://3.110.90.184/uploads/products/product-1792653911010.png',2,0,'2026-10-22 07:25:11'),(69,134,'http://3.110.90.184/uploads/products/product-1792654085624.png',0,1,'2026-10-22 07:28:06'),(70,134,'http://3.110.90.184/uploads/products/product-1792654085919.png',1,0,'2026-10-22 07:28:07'),(71,134,'http://3.110.90.184/uploads/products/product-1792654086481.png',2,0,'2026-10-22 07:28:07'),(72,134,'http://3.110.90.184/uploads/products/product-1792654086913.png',3,0,'2026-10-22 07:28:07'),(73,135,'http://3.110.90.184/uploads/products/product-1792654259385.png',0,1,'2026-10-22 07:31:01'),(74,135,'http://3.110.90.184/uploads/products/product-1792654260484.png',1,0,'2026-10-22 07:31:01'),(75,135,'http://3.110.90.184/uploads/products/product-1792654261741.png',2,0,'2026-10-22 07:31:01'),(76,136,'http://3.110.90.184/uploads/products/product-1792654459098.png',0,1,'2026-10-22 07:34:21'),(77,136,'http://3.110.90.184/uploads/products/product-1792654459426.png',1,0,'2026-10-22 07:34:21'),(78,136,'http://3.110.90.184/uploads/products/product-1792654460040.png',2,0,'2026-10-22 07:34:21'),(79,136,'http://3.110.90.184/uploads/products/product-1792654461708.png',3,0,'2026-10-22 07:34:21'),(80,137,'http://3.110.90.184/uploads/products/product-1792654650069.png',0,1,'2026-10-22 07:37:32'),(81,137,'http://3.110.90.184/uploads/products/product-1792654651192.png',1,0,'2026-10-22 07:37:32'),(82,137,'http://3.110.90.184/uploads/products/product-1792654651702.png',2,0,'2026-10-22 07:37:32'),(83,137,'http://3.110.90.184/uploads/products/product-1792654652870.png',3,0,'2026-10-22 07:37:32'),(84,138,'http://3.110.90.184/uploads/products/product-1792654886981.png',0,1,'2026-10-22 07:41:29'),(85,138,'http://3.110.90.184/uploads/products/product-1792654887721.png',1,0,'2026-10-22 07:41:29'),(86,138,'http://3.110.90.184/uploads/products/product-1792654888099.png',2,0,'2026-10-22 07:41:29'),(87,138,'http://3.110.90.184/uploads/products/product-1792654888973.png',3,0,'2026-10-22 07:41:29'),(88,139,'http://3.110.90.184/uploads/products/product-1792654949853.png',0,1,'2026-10-22 07:42:30'),(89,139,'http://3.110.90.184/uploads/products/product-1792654950723.png',1,0,'2026-10-22 07:42:30'),(90,140,'http://3.110.90.184/uploads/products/product-1792655277340.png',0,1,'2026-10-22 07:48:00'),(91,140,'http://3.110.90.184/uploads/products/product-1792655278608.png',1,0,'2026-10-22 07:48:00'),(92,140,'http://3.110.90.184/uploads/products/product-1792655279543.png',2,0,'2026-10-22 07:48:00'),(93,140,'http://3.110.90.184/uploads/products/product-1792655280323.png',3,0,'2026-10-22 07:48:00'),(94,141,'http://3.110.90.184/uploads/products/product-1792655304951.png',0,1,'2026-10-22 07:48:26'),(95,141,'http://3.110.90.184/uploads/products/product-1792655305665.png',1,0,'2026-10-22 07:48:26'),(96,141,'http://3.110.90.184/uploads/products/product-1792655306228.png',2,0,'2026-10-22 07:48:26'),(97,142,'http://3.110.90.184/uploads/products/product-1792655771097.png',0,1,'2026-10-22 07:56:11');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
INSERT INTO `product_reviews` VALUES (10,122,19,117,5,'soo good','2026-10-26 11:22:27'),(11,139,19,121,4,'good','2026-10-27 12:33:24'),(12,135,19,125,4,'super best product','2026-11-01 07:55:44');
/*!40000 ALTER TABLE `product_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
INSERT INTO `product_variants` VALUES (14,120,'{\"size\": \"S\", \"color\": \"Pink\"}',999.00,369.00,100,NULL,1,NULL,'2026-10-15 07:05:43','2026-10-15 07:05:43'),(15,120,'{\"size\": \"M\", \"color\": \"Pink\"}',999.00,369.00,100,NULL,1,NULL,'2026-10-15 07:05:43','2026-10-15 07:05:43'),(16,120,'{\"size\": \"L\", \"color\": \"Pink\"}',999.00,369.00,100,NULL,1,NULL,'2026-10-15 07:05:43','2026-10-15 07:05:43'),(17,120,'{\"size\": \"XL\", \"color\": \"Pink\"}',999.00,369.00,100,NULL,1,NULL,'2026-10-15 07:05:43','2026-10-15 07:05:43'),(18,121,'{\"size\": \"S\", \"color\": \"Blue\"}',999.00,369.00,100,NULL,1,NULL,'2026-10-15 11:15:59','2026-10-27 11:06:35'),(19,121,'{\"size\": \"M\", \"color\": \"Blue\"}',999.00,369.00,100,NULL,1,NULL,'2026-10-15 11:15:59','2026-10-15 11:15:59'),(20,121,'{\"size\": \"L\", \"color\": \"Blue\"}',999.00,369.00,100,NULL,1,NULL,'2026-10-15 11:15:59','2026-10-15 11:15:59'),(21,122,'{\"size\": \"S\", \"color\": \"green\"}',1200.00,489.00,93,NULL,1,NULL,'2026-10-18 08:12:14','2026-10-26 12:32:53'),(22,122,'{\"size\": \"M\", \"color\": \"green\"}',1200.00,489.00,100,NULL,1,NULL,'2026-10-18 08:12:14','2026-10-19 08:57:51'),(23,122,'{\"size\": \"L\", \"color\": \"green\"}',1200.00,489.00,100,NULL,1,NULL,'2026-10-18 08:12:14','2026-10-18 08:12:14'),(24,122,'{\"size\": \"XL\", \"color\": \"green\"}',1200.00,489.00,100,NULL,1,NULL,'2026-10-18 08:12:14','2026-10-18 08:12:14'),(25,123,'{\"ram\": \"8\", \"color\": \"Midnight Black\", \"storage\": \"128\"}',15899.00,13799.00,119,'OPPO-K10-BLK-128',1,'[\"http://3.110.90.184/uploads/products/product-1792408195038.png\", \"http://3.110.90.184/uploads/products/product-1792408195809.png\"]','2026-10-19 11:09:56','2026-10-27 11:06:35'),(26,123,'{\"ram\": \"8\", \"color\": \"Ocean Blue\", \"storage\": \"128\"}',15899.00,13799.00,123,'OPPO-K10-BLU-128',1,'[\"http://3.110.90.184/uploads/products/product-1792408196233.png\", \"http://3.110.90.184/uploads/products/product-1792408196569.png\"]','2026-10-19 11:09:56','2026-10-19 11:09:56'),(27,124,'{\"ram\": \"6\", \"color\": \"Blitz Blue\", \"storage\": \"128\"}',19499.00,19000.00,50,'SAM-M17E-BLU-6-128',1,'[\"http://3.110.90.184/uploads/products/product-1792647017988.png\", \"http://3.110.90.184/uploads/products/product-1792647018522.png\", \"http://3.110.90.184/uploads/products/product-1792647019235.png\"]','2026-10-22 05:30:19','2026-10-22 05:30:19'),(28,125,'{\"ram\": \"4 GB\", \"color\": \"Graphite Grey\", \"storage\": \"128 GB eMMC\", \"processor\": \"MediaTek Kompanio 520\"}',22990.00,22000.00,50,NULL,1,'[\"http://3.110.90.184/uploads/products/product-1792647389288.png\", \"http://3.110.90.184/uploads/products/product-1792647390303.png\", \"http://3.110.90.184/uploads/products/product-1792647390966.png\", \"http://3.110.90.184/uploads/products/product-1792647391960.png\"]','2026-10-22 05:36:32','2026-10-22 05:36:32'),(29,130,'{\"ram\": \"8GB\", \"color\": \"Burgundy\", \"storage\": \"2TB\"}',329900.00,328999.00,0,'APPLE-IP18PM-BURGUNDY-2TB',0,'[\"http://3.110.90.184/uploads/products/product-1792653193322.png\", \"http://3.110.90.184/uploads/products/product-1792653197067.png\", \"http://3.110.90.184/uploads/products/product-1792653197937.png\", \"http://3.110.90.184/uploads/products/product-1792653200897.png\"]','2026-10-22 07:13:21','2026-10-30 07:57:22'),(30,134,'{\"ram\": \"48 GB\", \"color\": \"Black\", \"storage\": \"2 TB\", \"processor\": \"Apple M5 Max\"}',619900.00,618999.00,1,NULL,1,'[\"http://3.110.90.184/uploads/products/product-1792654085624.png\", \"http://3.110.90.184/uploads/products/product-1792654085919.png\", \"http://3.110.90.184/uploads/products/product-1792654086481.png\", \"http://3.110.90.184/uploads/products/product-1792654086913.png\"]','2026-10-22 07:28:07','2026-10-22 07:28:07'),(31,135,'{\"size\": \"2.2\", \"color\": \"Gold\"}',2799.00,192.00,48,NULL,1,'[]','2026-10-22 07:31:01','2026-10-30 11:31:58'),(32,135,'{\"size\": \"2.4\", \"color\": \"Gold\"}',2799.00,192.00,100,NULL,1,'[]','2026-10-22 07:31:01','2026-10-22 07:31:01'),(33,135,'{\"size\": \"2.6\", \"color\": \"Gold\"}',2799.00,192.00,50,NULL,1,'[]','2026-10-22 07:31:01','2026-10-22 07:31:01'),(34,135,'{\"size\": \"2.8\", \"color\": \"Gold\"}',2799.00,192.00,50,NULL,1,'[]','2026-10-22 07:31:01','2026-10-22 07:31:01'),(35,139,'{\"size\": \"26\", \"color\": \"INDIGO-3\"}',461.00,399.00,98,NULL,1,'[]','2026-10-22 07:42:30','2026-11-01 07:57:01'),(36,139,'{\"size\": \"32\", \"color\": \"INDIGO-3\"}',461.00,399.00,100,NULL,1,'[]','2026-10-22 07:42:30','2026-10-22 07:42:30'),(37,139,'{\"size\": \"36\", \"color\": \"INDIGO-3\"}',461.00,399.00,100,NULL,1,'[]','2026-10-22 07:42:30','2026-10-22 07:42:30'),(38,141,'{\"size\": \"6\", \"color\": \"BLK/GOLD\"}',999.00,649.00,99,NULL,1,'[]','2026-10-22 07:48:26','2026-10-30 07:24:23'),(39,141,'{\"size\": \"7\", \"color\": \"BLK/GOLD\"}',999.00,649.00,100,NULL,1,'[]','2026-10-22 07:48:26','2026-10-22 07:48:26'),(40,141,'{\"size\": \"8\", \"color\": \"BLK/GOLD\"}',999.00,649.00,100,NULL,1,'[]','2026-10-22 07:48:26','2026-10-22 07:48:26'),(41,141,'{\"size\": \"9\", \"color\": \"BLK/GOLD\"}',999.00,649.00,100,NULL,1,'[]','2026-10-22 07:48:26','2026-10-22 07:48:26'),(42,141,'{\"size\": \"10\", \"color\": \"BLK/GOLD\"}',999.00,649.00,100,NULL,1,'[]','2026-10-22 07:48:26','2026-10-22 07:48:26');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `product_type` varchar(100) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `description` text,
  `image` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `stock` int NOT NULL DEFAULT '0',
  `merchant_id` int DEFAULT NULL,
  `original_price` decimal(10,2) DEFAULT NULL,
  `discount` decimal(5,2) DEFAULT NULL,
  `gst_rate` decimal(5,2) DEFAULT NULL,
  `brand` varchar(100) DEFAULT NULL,
  `availability` varchar(50) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `size_fit` text,
  `material_care` text,
  `product_details` json DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=143 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (107,'bangles','Fashion','Fashion',50.00,'they are glass bangles','http://3.110.90.184/uploads/products/product-1789644057084.png','2026-09-17 11:20:57',15,26,100.00,50.00,NULL,'fasion','In Stock','rejected','free','usse carefully thay may broke',NULL),(120,'Viscose Rayon Single Long Kurti for Women | A-Line Kurta | V Neck Tunic for Women | 3/4 Sleeve Straight Kurta | Pink','Fashion','Kurti',369.00,'Graceful & Elegant Ethnic Lady Viscose Rayon Long Kurti for Women\n\nEnhance your ethnic wardrobe with this beautifully crafted Viscose Rayon Long Kurti designed especially for modern women. Made from soft and breathable viscose rayon fabric, this kurti ensures all-day comfort with a smooth and lightweight feel.\n\nThe stylish A-Line silhouette gives a flattering fit that flows gracefully, making it perfect for daily wear, office, college, festive gatherings, and casual outings.\n\nKey Features:\n\n✔ Premium Viscose Rayon Fabric – Soft, Lightweight & Skin-Friendly\n✔ Elegant A-Line Pattern for a Flattering Look\n✔ Classic Round Neck Design\n✔ Comfortable 3/4 Sleeves for Everyday Style\n✔ Full Length Straight Kurta Design\n✔ Suitable for Casual, Office, Festive & Daily Wear\nThis long kurti pairs beautifully with leggings, palazzos, straight pants, or jeans to create a versatile ethnic or fusion look. The minimal yet classy design makes it a must-have addition to every woman’s wardrobe.\n\nStyle Tip: Pair it with ethnic jhumkas and flats for a traditional look, or style it with heels and a sling bag for a modern chic appearance.\n\nFeel confident, comfortable, and effortlessly stylish with this timeless ethnic kurti.','http://3.110.90.184/uploads/products/product-1792047938751.png','2026-10-15 07:05:43',93,14,999.00,63.00,5.00,'Bazaar','In Stock','approved','Comfortable fit, available in multiple sizes','100% Cotton. Machine wash with similar colors. Use mild detergent. Do not bleach. Dry in shade. Iron on low to medium heat.','{\"color\": \"Pink\", \"fabric\": \"cotton\", \"pattern\": \"Floral Print\", \"occasion\": \"casual\", \"sleeveType\": \"3/4 Sleeves\"}'),(121,'Viscose Rayon Single Long Kurti for Women | A-Line Kurta | V Neck Tunic for Women | 3/4 Sleeve Straight Kurta | Pink','Fashion','Kurti',0.00,'these are best','http://3.110.90.184/uploads/products/product-1792062958664.png','2026-10-15 11:15:59',98,14,0.00,0.00,5.00,'Bazaar','Out of Stock','approved','Comfortable fit, available in multiple sizes','only dry clean','{\"color\": \"Blue\", \"fabric\": \"cotton\", \"pattern\": \"plain\", \"occasion\": \"casual\", \"sleeveType\": \"3/4 Sleeves\"}'),(122,'Bewakoof Official Friends Merchandise Women\'s Graphic Printed Oversized Half Sleeve Round Neck Cotton Jersey','Fashion','T-Shirt',0.00,'Oversized T-shirt for Woman Half Sleeve – Relaxed oversized fit designed for everyday comfort, giving this women’s t-shirt a casual streetwear-inspired vibe with trend-forward appeal.\n100% Cotton Fabric – Cotton t-shirt for woman that is soft, breathable, and durable, ensuring long-lasting wear through casual outings, lounging, or travel.\nHalf Sleeve Design – Lightweight and airy, this half sleeve t-shirt for women is ideal for summer days, gym sessions, or layering under jackets and western tops.\nTrendy Women’s T-shirt – A versatile piece that doubles as casual wear, lounge wear, or a top for women stylish western, making it a wardrobe must-have.\nEffortless Styling – Pair this oversized half sleeve t-shirt for women with jeans, shorts, or joggers for a chic, easy-to-style everyday look.','http://3.110.90.184/uploads/products/product-1792311132911.png','2026-10-18 08:12:14',0,14,0.00,0.00,5.00,'Bewakoof','Out of Stock','approved','Regular Fit','dry clean only','{\"fit\": \"Slim Fit\", \"color\": \"green\", \"fabric\": \"cotton\", \"gender\": \"women\", \"pattern\": \"plain\"}'),(123,'OPPO K10 5G','Electronics','Smartphone',13799.00,'• Display: 6.56-inch HD+ (720 x 1612 pixels) IPS LCD with a 90Hz refresh rate and 600 nits peak brightness\n• Processor: Octa-core MediaTek Dimensity 810 (6nm) with Mali-G57 MC2 GPU\n• RAM & Storage: 6GB or 8GB LPDDR4x RAM (with RAM expansion tech) and 128GB UFS 2.2 storage, expandable up to 1TB via microSDXC\n• Rear Cameras: 48MP main camera + 2MP depth sensor\n• Front Camera: 8MP selfie camera\n• Battery & Charging: 5,000mAh battery with 33W SUPERVOOC fast charging\n• Operating System: ColorOS 12.1 based on Android 12\n• Design & Build: Ultra-slim 7.99mm profile, IPX4 water resistance, side-mounted fingerprint scanner, and available in Midnight Black and Ocean Blue\n• Audio & Ports: Ultra-linear dual stereo speakers, USB Type-C, and a 3.5mm headphone jack\nCategory*','http://3.110.90.184/uploads/products/product-1792408195038.png','2026-10-19 11:09:56',246,14,15899.00,13.00,18.00,'OPPO','In Stock','approved','Not Applicable','Plastic body. Clean with a soft, dry microfiber cloth. Avoid water exposure.','{\"ram\": \"8\", \"color\": \"black\", \"model\": \"K10 5G\", \"battery\": \"5000\", \"storage\": \"128\", \"warranty\": \"1 Year Manufacturer Warranty\", \"displaySize\": \"6.58\", \"operatingSystem\": \"Android 12 (ColorOS 12.1)\"}'),(124,'Samsung Galaxy M17e 5G Mobile','Electronics','Smartphone',19000.00,'Samsung Galaxy M17e 5G smartphone with 6GB RAM and 128GB storage, featuring a 6.7-inch 120Hz HD+ display, MediaTek Dimensity 6300 processor, 6000mAh battery, 50MP dual camera, IP54 rating, Knox Security and up to 6 generations of OS upgrades.','http://3.110.90.184/uploads/products/product-1792647017988.png','2026-10-22 05:30:19',50,14,19499.00,3.00,18.00,'Samsung','In Stock','approved','6.7-inch display; 8.2mm slim design','Durable smartphone body. Keep away from excessive moisture, extreme heat and physical impact. Clean the display with a soft, dry microfiber cloth','{\"ram\": \"8\", \"color\": \"Blitz Blue\", \"model\": \"Galaxy M17e 5G\", \"battery\": \"5000\", \"storage\": \"128\", \"warranty\": \"1 Year Manufacturer Warranty\", \"operatingSystem\": \"Android 16 / One UI 8.0\"}'),(125,'Lenovo Chromebook MediaTek Kompanio 520 14M868 Chromebook','Electronics','Laptop',22000.00,'Lenovo Chromebook powered by MediaTek Kompanio 520 processor, featuring 4GB RAM, 128GB eMMC storage and Chrome OS. It comes with a 14-inch display and a 180-degree lay-flat hinge designed for flexible productivity and collaboration.','http://3.110.90.184/uploads/products/product-1792647389288.png','2026-10-22 05:36:32',50,14,22990.00,4.00,18.00,'Lenovo','In Stock','approved','14-inch Chromebook; compact and portable design','Handle with care. Keep the Chromebook away from liquids, excessive heat and dust. Clean the display with a soft, dry microfiber cloth.','{\"ram\": \"4 GB\", \"model\": \"14M868\", \"battery\": \"5000\", \"storage\": \"128 GB eMMC\", \"graphics\": \"Integrated Graphics\", \"warranty\": \"1 Year Manufacturer Warranty\", \"processor\": \"MediaTek Kompanio 520\", \"screenSize\": \"14 inch\", \"operatingSystem\": \"Chrome OS\"}'),(126,'OnePlus Pad Go 8 GB RAM 128 GB ROM 11.35 inch Wi-Fi Only Tablet','Electronics','Tablet',17999.00,'OnePlus Pad Go tablet with 8GB RAM and 128GB storage, featuring an 11.35-inch display and MediaTek Helio G99 processor. This Wi-Fi-only tablet is designed for gaming, entertainment, browsing and everyday productivity.','http://3.110.90.184/uploads/products/product-1792649227340.png','2026-10-22 06:07:09',50,14,19999.00,10.00,18.00,'OnePlus','In Stock','approved','11.35-inch tablet; Twin Mint color','Handle with care. Keep away from liquids, excessive heat and dust. Clean the screen with a soft, dry microfiber cloth.','{\"ram\": \"8 GB\", \"color\": \"Twin Mint\", \"model\": \"OnePlus Pad Go\", \"battery\": \"5000\", \"storage\": \"128 GB \", \"warranty\": \"1 Year Manufacturer Warranty\", \"displaySize\": \"11.35 inch\", \"operatingSystem\": \"Android 16 / One UI 8.0\"}'),(127,'GameSir H9 Grey Smartwatch','Electronics','Smart Watch',790.00,'GameSir H9 smartwatch with Bluetooth connectivity, fitness tracking and heart rate monitoring. It features a 49 mm display and is designed for everyday fitness, health tracking and smart connectivity.','http://3.110.90.184/uploads/products/product-1792649752324.png','2026-10-22 06:15:54',50,14,2999.00,74.00,0.00,'GameSir','In Stock','approved','49 mm display; Grey strap','Handle with care. Keep the smartwatch away from excessive heat and harsh chemicals. Clean the watch and strap with a soft, dry cloth. Avoid charging when the device or charging area is w','{\"color\": \"Grey\", \"model\": \"H9\", \"warranty\": \"3 Month Domestic Warranty\", \"batteryLife\": \"7 days\", \"displaySize\": \"49 mm\", \"displayType\": \"Digital Display\", \"connectivity\": \"Bluetooth\", \"waterResistance\": \"IP68\"}'),(128,'boAt Rockerz 480 Wireless Bluetooth Headphones','Electronics','Headphones',1599.00,'boAt Rockerz 480 wireless over-ear Bluetooth headphones with RGB LEDs, 6 light modes, 40mm drivers, BEAST Mode with 40ms low latency, up to 60 hours of playback, ENx Technology, dual pairing, Bluetooth 5.3 and microphone support.','http://3.110.90.184/uploads/products/product-1792652682358.png','2026-10-22 07:04:43',49,14,3790.00,58.00,0.00,'boAt','In Stock','approved','Over-ear design; White Sabre','Handle with care. Keep the headphones away from water, excessive heat and moisture. Clean the earcups and headband with a soft, dry cloth. Store in a dry place when not in use.','{\"type\": \"Over Ear\", \"color\": \"White Sabre\", \"model\": \"Rockerz 480\", \"warranty\": \"1 Year Warranty\", \"batteryLife\": \"Up to 60 hours\", \"connectivity\": \"Bluetooth 5.3\", \"noiseCancellation\": \"Active Noise Cancellation\"}'),(129,'JBL Go 4 Portable Bluetooth Speaker','Electronics','Bluetooth Speaker',3999.00,'Portable Bluetooth speaker with powerful sound, compact design, wireless connectivity and long battery life. Suitable for music, travel and everyday use.','http://3.110.90.184/uploads/products/product-1792653026656.png','2026-10-22 07:10:28',100,14,4999.00,20.00,0.00,'JBL','In Stock','approved','Compact and portable','Durable plastic body. Keep away from extreme heat and clean with a soft, dry cloth.','{\"color\": \"Black\", \"model\": \"JBL Go 4\", \"warranty\": \"1 Year Warranty\", \"batteryLife\": \"Up to 7 hours\", \"powerOutput\": \"4.2 W\", \"connectivity\": \"Bluetooth 5.3\", \"waterResistance\": \"IP67\"}'),(130,'Apple iPhone 18 Pro Max','Electronics','Smartphone',328999.00,'Apple iPhone 18 Pro Max with 2 TB storage, A20 Pro chip, 48MP triple rear camera system, 18MP front camera, and 6.9-inch display.','http://3.110.90.184/uploads/products/product-1792653193322.png','2026-10-22 07:13:21',1,14,329900.00,0.00,18.00,'Apple','In Stock','approved','6.9-inch display','Premium smartphone; handle with care and keep away from water, dust and extreme temperatures.','{\"ram\": \"8GB\", \"color\": \"Burgundy\", \"model\": \"iPhone 18 Pro Max\", \"battery\": \"5000mAh\", \"storage\": \"2TB\", \"warranty\": \"Apple One (1) Year Limited Warranty\", \"displaySize\": \"6.9 inch\", \"operatingSystem\": \"iOS\"}'),(131,'Fujifilm Instax Mini 12 Instant Camera - Pastel Blue','Electronics','Camera',6999.00,'The Fujifilm Instax Mini 12 is an easy-to-use instant camera with automatic exposure, built-in selfie mirror, close-up mode with parallax correction, automatic flash control, and approximately 5-second photo ejection. It uses INSTAX MINI instant film.','http://3.110.90.184/uploads/products/product-1792653313238.png','2026-10-22 07:15:17',50,14,9499.00,26.00,0.00,'Fujifilm','In Stock','approved','10.4 × 6.6 × 12.2 cm','Camera body; handle with care and keep away from moisture, dust, and extreme temperatures.','{\"model\": \"Instax Mini 12\", \"warranty\": \"1 Year Warranty\", \"lensMount\": \"20\", \"cameraType\": \"Instant Camera\", \"resolution\": \"24\", \"sensorType\": \"CMOS\", \"videoResolution\": \"4K\"}'),(132,'Ant Master 05 Wired USB Keyboard','Electronics','Keyboard',219.00,'Full-size 104-key wired USB keyboard with numeric pad, membrane silent typing, 1.3m cable, plug-and-play connectivity, ergonomic design, and compatibility with PC, laptop, Mac and Linux.','http://3.110.90.184/uploads/products/product-1792653616430.png','2026-10-22 07:20:18',99,14,699.00,69.00,0.00,'Ant','In Stock','approved','Full-size, 104 keys, numeric keypad','Durable plastic construction; keep dry and clean; wipe with a soft dry cloth','{\"color\": \"Black\", \"model\": \"Master 05\", \"warranty\": \"1 Year Warranty\", \"backlight\": \"RGB\", \"switchType\": \"Membrane\", \"connectivity\": \"USB / Wired\", \"keyboardType\": \"Full-size / Standard\"}'),(133,'Dell MS116 USB Optical Mouse (Black)','Electronics','Mouse',290.00,'Dell MS116 wired optical mouse with 1000 DPI optical LED tracking, USB connectivity, plug-and-play convenience, two buttons and a scroll wheel. Suitable for home and office use.','http://3.110.90.184/uploads/products/product-1792653910575.png','2026-10-22 07:25:11',98,14,650.00,55.00,0.00,'Dell','In Stock','approved','Standard-sized mouse, designed for comfortable extended use','Durable plastic body; clean with a soft, dry cloth and keep away from liquids','{\"dpi\": \"1000DPI\", \"color\": \"Black\", \"model\": \"MS116\", \"warranty\": \"1 Year Warranty\", \"mouseType\": \"Wired Optical Mouse\", \"connectivity\": \"USB\"}'),(134,'Apple MacBook Pro','Electronics','Laptop',618999.00,'Apple MacBook Pro (M5 Max, 2026) with M5 Max chip, 48 GB RAM, 2 TB SSD and Liquid Retina XDR display.','http://3.110.90.184/uploads/products/product-1792654085624.png','2026-10-22 07:28:06',1,14,619900.00,0.00,18.00,'Apple','In Stock','approved','16 inch','Premium laptop; handle with care and keep away from liquids, dust and extreme temperatures.','{\"ram\": \"48 GB\", \"model\": \"MacBook Pro (M5 Max, 2026)\", \"battery\": \"5000mAh\", \"storage\": \"2 TB SSD\", \"graphics\": \"Integrated Apple GPU\", \"warranty\": \"1 Year Limited Warranty\", \"processor\": \"Apple M5 Max\", \"screenSize\": \"16 inch\", \"operatingSystem\": \"Tahoe\"}'),(135,'ZENEME Set Of 4 Gold-Plated Classic Textured Handcrafted Bangles','Fashion','Bangles',192.00,'Stylish party-wear gold-plated handcrafted bangles suitable for office wear, weddings, parties and other occasions. The set features a classic textured design and is made from non-precious metal with gold plating.','http://3.110.90.184/uploads/products/product-1792654259385.png','2026-10-22 07:31:01',250,14,2799.00,93.00,5.00,'ZENEME','In Stock','approved','Available in bangle sizes 2.4, 2.6 and 2.8','Gold-plated brass. Keep away from water, direct heat, perfumes, deodorants and strong chemicals. Store in a box or cloth pouch when not in use.','{\"color\": \"Gold\", \"design\": \"Traditional\", \"packOf\": \"4\", \"material\": \"Gold-Plated Brass\", \"occasion\": \"Casual, Office, Festive\", \"bangleType\": \"Gold Plated Bangle\"}'),(136,'Apple 2025 iPad (A16)','Electronics','Tablet',49900.00,'Apple 2025 iPad with A16 chip, 11-inch display, 128 GB storage and Wi-Fi connectivity.','http://3.110.90.184/uploads/products/product-1792654459098.png','2026-10-22 07:34:21',50,14,49900.00,0.00,18.00,'Apple','In Stock','approved','11 inch','Handle with care; keep away from liquids and extreme temperatures','{\"ram\": \"8GB\", \"color\": \"Silver\", \"model\": \"Apple 2025 iPad (A16)\", \"battery\": \"7698 mAh\", \"storage\": \"128GB\", \"warranty\": \"1 Year Brand Warranty\", \"displaySize\": \"11 inch\", \"operatingSystem\": \"iPadOS\"}'),(137,'Libas Printed Silk Blend Saree With Unstitched Blouse Piece','Fashion','Saree',579.00,'Our Yellow Printed Silk Blend Saree Features Captivating Floral Printed Design. Complemented With An Unstitched Blouse Piece. This Charming Saree Is Perfect For Festive Wear','http://3.110.90.184/uploads/products/product-1792654650069.png','2026-10-22 07:37:32',99,14,2349.00,75.00,0.00,'Libas','In Stock','approved','One Size','Silk Blend; Machine Wash','{\"color\": \"Navy Blue\", \"fabric\": \"Silk Blend\", \"pattern\": \"Floral Printed\", \"occasion\": \"Festive, Wedding\", \"sareeLength\": \"5.5\", \"blouseIncluded\": \"Yes — Unstitched Blouse Piece\"}'),(138,'Modern 3 Seater Fabric Sofa','Home','Sofa',24999.00,'Modern 3-seater sofa with comfortable cushioning, premium fabric upholstery and a sturdy frame. Suitable for living rooms, apartments and family spaces.','http://3.110.90.184/uploads/products/product-1792654886981.png','2026-10-22 07:41:29',100,14,32999.00,24.00,0.00,'HomeCraft','In Stock','approved','3 Seater','Premium fabric upholstery with a sturdy frame. Vacuum regularly and clean spills immediately with a soft cloth.','{\"color\": \"Grey\", \"shape\": \"Straight\", \"material\": \"Fabric\", \"dimensions\": \"78 × 32 × 34 inches\", \"seatingCapacity\": \"3 Seater\"}'),(139,'Tokyo Talkies Women’s High-Rise Straight Fit Jeans','Fashion','Jeans',399.00,'High-rise straight-fit jeans designed for a comfortable, stylish everyday look. Made from soft and durable cotton denim with a classic finish, suitable for casual outings and semi-casual occasions.','http://3.110.90.184/uploads/products/product-1792654949853.png','2026-10-22 07:42:30',300,14,461.00,13.00,5.00,'Tokyo Talkies','In Stock','approved','Comfortable fit, available in multiple sizes','100% Cotton; Machine wash in cold water on a gentle cycle. Use mild detergent, avoid bleach, wash inside out, and air dry or tumble dry on low.','{\"fit\": \"Straight Fit\", \"color\": \"Blue\", \"fabric\": \"Denim\", \"gender\": \"Women\", \"pattern\": \"Solid\"}'),(140,'Modern King Size Wooden Bed','Home','Bed',29999.00,'Modern king-size bed with a sturdy wooden frame and elegant design. Provides a comfortable and durable sleeping solution for bedrooms.','http://3.110.90.184/uploads/products/product-1792655277340.png','2026-10-22 07:48:00',100,14,39999.00,25.00,0.00,'HomeCraft','In Stock','approved','King Size','Solid engineered wood finish. Wipe with a soft dry cloth and keep away from excessive moisture.','{\"color\": \"Walnut Brown\", \"bedSize\": \"King Size\", \"material\": \"Engineered Wood\", \"dimensions\": \"78 × 72 × 36 inches\"}'),(141,'Campus Men Oxyfit (N) Walking Shoes','Fashion','Shoes',649.00,'Men\'s casual slip-on walking shoes with breathable mesh upper, cushioned Pillo Foam sole and Memory Foam insole. Lightweight and suitable for walking, office, college, travel and daily casual wear.','http://3.110.90.184/uploads/products/product-1792655304951.png','2026-10-22 07:48:26',500,14,999.00,35.00,18.00,'Campus','In Stock','approved','Regular fit; available in UK sizes 6, 7, 8, 9 and 10','Mesh upper, Memory Foam insole, Rubber/Pillo Foam sole. Wipe with a damp cloth; for deeper cleaning use mild soap and water.','{\"color\": \"BLK/GOLD\", \"gender\": \"Men\", \"closure\": \"Pull-On\", \"pattern\": \"Solid\", \"material\": \"Mesh\", \"occasion\": \"Casual, Walking, Office, College, Travel\"}'),(142,'Royal Luxury Turkish Style Teak Wood Dining Table Set','Home','Dining Table',420830.00,'Premium solid teak wood 6-seater dining table set designed in a luxurious Turkish style. Suitable for dining rooms and living spaces, offering a stylish and durable dining solution.','http://3.110.90.184/uploads/products/product-1792655771097.png','2026-10-22 07:56:11',95,14,598940.00,30.00,0.00,'royal wood','In Stock','pending','6 Seater','Solid teak wood with premium finish. Clean with a soft dry cloth and avoid prolonged exposure to moisture.','{\"color\": \"Golden & Grey\", \"shape\": \"Rectangular\", \"material\": \"Solid Teak Wood\", \"dimensions\": \"72 × 36 × 30 inches\", \"seatingCapacity\": \"6 Seater\"}');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipment_tracking_events`
--

DROP TABLE IF EXISTS `shipment_tracking_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
INSERT INTO `shipment_tracking_events` VALUES (1,1,'Ready for Pickup','merchant',NULL,'Chennai','Tamil Nadu','Merchant marked parcel ready for pickup.','merchant',14,'2026-10-30 07:45:32'),(2,1,'Pickup Assigned','merchant',NULL,'Chennai','Tamil Nadu','Pickup accepted by delivery partner.','delivery',1,'2026-10-30 07:47:26'),(3,1,'Picked Up','merchant',NULL,'Chennai','Tamil Nadu','Delivery partner confirmed collection from merchant.','delivery',1,'2026-10-30 07:47:36'),(4,1,'Received at Origin Hub','hub',1,'Chennai','Tamil Nadu','Shipment received at origin hub: Chennai Main Hub','dispatch',34,'2026-10-30 07:48:10'),(5,2,'Ready for Pickup','merchant',NULL,'Chennai','Tamil Nadu','Merchant marked parcel ready for pickup.','merchant',14,'2026-10-30 08:52:03'),(6,2,'Pickup Assigned','merchant',NULL,'Chennai','Tamil Nadu','Pickup accepted by delivery partner.','delivery',3,'2026-10-30 09:52:52'),(7,2,'Picked Up','merchant',NULL,'Chennai','Tamil Nadu','Delivery partner confirmed collection from merchant.','delivery',3,'2026-10-30 09:52:55'),(8,2,'Received at Origin Hub','hub',1,'Chennai','Tamil Nadu','Shipment received at origin hub: Chennai Main Hub','dispatch',34,'2026-10-30 09:53:32'),(9,2,'In Transit','hub',1,'Chennai','Tamil Nadu','Shipment dispatched from Chennai Main Hub to jrg','dispatch',34,'2026-10-30 09:53:38'),(10,2,'Arrived at Destination Hub','hub',5,'jangareddygudem','Andhra Pradesh','Shipment received at destination hub: jrg','dispatch',34,'2026-10-30 09:53:46'),(11,3,'Ready for Pickup','merchant',NULL,'Chennai','Tamil Nadu','Merchant marked parcel ready for pickup.','merchant',14,'2026-10-30 10:52:09'),(12,3,'Pickup Assigned','merchant',NULL,'Chennai','Tamil Nadu','Pickup accepted by delivery partner.','delivery',1,'2026-10-30 11:20:14'),(13,3,'Picked Up','merchant',NULL,'Chennai','Tamil Nadu','Delivery partner confirmed collection from merchant.','delivery',1,'2026-10-30 11:20:16'),(14,3,'Received at Origin Hub','hub',1,'Chennai','Tamil Nadu','Shipment received at origin hub: Chennai Main Hub','dispatch',34,'2026-10-30 11:20:31'),(15,3,'In Transit','hub',1,'Chennai','Tamil Nadu','Shipment dispatched from Chennai Main Hub to JRG hub','dispatch',34,'2026-10-30 11:20:35'),(16,3,'Arrived at Destination Hub','hub',4,'WEST GODAVARI','Andhra Pradesh','Shipment received at destination hub: JRG hub','dispatch',34,'2026-10-30 11:20:39'),(17,4,'Ready for Pickup','merchant',NULL,'Chennai','Tamil Nadu','Merchant marked parcel ready for pickup.','merchant',14,'2026-10-30 11:32:40'),(18,5,'Ready for Pickup','merchant',NULL,'Chennai','Tamil Nadu','Merchant marked parcel ready for pickup.','merchant',14,'2026-10-30 11:39:27'),(19,4,'Pickup Assigned','merchant',NULL,'Chennai','Tamil Nadu','Pickup accepted by delivery partner.','delivery',1,'2026-10-30 11:39:40'),(20,4,'Picked Up','merchant',NULL,'Chennai','Tamil Nadu','Delivery partner confirmed collection from merchant.','delivery',1,'2026-10-30 11:39:46'),(21,4,'Received at Origin Hub','hub',1,'Chennai','Tamil Nadu','Shipment received at origin hub: Chennai Main Hub','dispatch',34,'2026-10-30 11:40:03'),(22,4,'In Transit','hub',1,'Chennai','Tamil Nadu','Shipment dispatched from Chennai Main Hub to JRG hub','dispatch',34,'2026-10-30 11:40:13'),(23,4,'Arrived at Destination Hub','hub',4,'WEST GODAVARI','Andhra Pradesh','Shipment received at destination hub: JRG hub','dispatch',34,'2026-10-30 11:40:17'),(24,5,'Pickup Assigned','merchant',NULL,'Chennai','Tamil Nadu','Pickup accepted by delivery partner.','delivery',1,'2026-10-30 11:40:38'),(25,5,'Picked Up','merchant',NULL,'Chennai','Tamil Nadu','Delivery partner confirmed collection from merchant.','delivery',1,'2026-10-30 11:40:41'),(26,6,'Ready for Pickup','merchant',NULL,'Chennai','Tamil Nadu','Merchant marked parcel ready for pickup.','merchant',14,'2026-11-01 07:57:14'),(27,6,'Pickup Assigned','merchant',NULL,'Chennai','Tamil Nadu','Pickup accepted by delivery partner.','delivery',1,'2026-11-01 07:58:15'),(28,6,'Picked Up','merchant',NULL,'Chennai','Tamil Nadu','Delivery partner confirmed collection from merchant.','delivery',1,'2026-11-01 07:58:17'),(29,5,'Received at Origin Hub','hub',1,'Chennai','Tamil Nadu','Shipment received at origin hub: Chennai Main Hub','dispatch',34,'2026-11-01 07:58:32'),(30,6,'Received at Origin Hub','hub',1,'Chennai','Tamil Nadu','Shipment received at origin hub: Chennai Main Hub','dispatch',34,'2026-11-01 07:58:35'),(31,7,'Ready for Pickup','merchant',NULL,'Chennai','Tamil Nadu','Merchant marked parcel ready for pickup.','merchant',14,'2026-11-01 13:09:41'),(32,7,'Pickup Assigned','merchant',NULL,'Chennai','Tamil Nadu','Pickup accepted by delivery partner.','delivery',1,'2026-11-01 13:11:09'),(33,7,'Picked Up','merchant',NULL,'Chennai','Tamil Nadu','Delivery partner confirmed collection from merchant.','delivery',1,'2026-11-01 13:11:10'),(34,7,'Received at Origin Hub','hub',1,'Chennai','Tamil Nadu','Shipment received at origin hub: Chennai Main Hub','dispatch',34,'2026-11-01 13:11:37'),(35,7,'In Transit','hub',1,'Chennai','Tamil Nadu','Shipment dispatched from Chennai Main Hub to JRG hub','dispatch',34,'2026-11-01 13:11:42'),(36,5,'In Transit','hub',1,'Chennai','Tamil Nadu','Shipment dispatched from Chennai Main Hub to JRG hub','dispatch',34,'2026-11-01 13:11:45');
/*!40000 ALTER TABLE `shipment_tracking_events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `role` varchar(20) NOT NULL DEFAULT 'customer',
  `business_name` varchar(150) DEFAULT NULL,
  `security_question` varchar(255) DEFAULT NULL,
  `security_answer` varchar(255) DEFAULT NULL,
  `aadhaar_image` text,
  `approval_status` varchar(20) NOT NULL DEFAULT 'Approved',
  `approval_date` timestamp NULL DEFAULT NULL,
  `business_address` varchar(500) DEFAULT NULL,
  `business_city` varchar(100) DEFAULT NULL,
  `business_state` varchar(100) DEFAULT NULL,
  `business_pincode` varchar(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Test User','test3@example.com','$2b$10$rRMNMzMZNGI8YqCHUKx6ouNpT4HkJBBSZNqz7DEnFBjkubYxEn05S','9876543210','2026-08-13 06:17:22','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(2,'gupta','guptaathyam@gmail.com','$2b$10$0y7MxH0dTSOeqhfNSpvHSupg7dGQBFLLoad4JcaMzHROX8ooDz99q',NULL,'2026-08-13 08:02:55','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(3,'gupta','binduathyam@gmail.com','$2b$10$/UX/TBMCGai2rb39O9Vc7eQClqFaMc69m6G.JmgNKsMrY4NZdUAlO',NULL,'2026-08-13 08:04:02','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(4,'Athyam','deviathyam@gmail.com','$2b$10$47Ha/yyDHUcjfITBEUBtAOXvobDti8iGTvAnJcrhuV6CITyChQJrm','9010626662','2026-08-13 10:11:29','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(5,'Binu','poornimaathyam@gmail.com','$2b$10$RVCJDk.8vCMqfv63qjXghuJnQqn31Tsh67OIBSUPwWJVvjorNanoO','9010626662','2026-08-13 10:16:03','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(6,'Bindu','manikanta@gmail.com','$2b$10$PWZtuCEuRS.Jg4kh2Njdiu9/FgtnjDyRXH6xvzp2PXiZfRxwssc6S','9010626662','2026-08-13 10:48:29','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(7,'John','john@gmail.com','$2b$10$IrADb7STleNaN1/5lWBCBOMWzLsD2eTshNHW.HrV1nMsk2VjUoXga','9010626662','2026-08-13 10:56:25','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(8,'bindu','vasuathyam@gmail.com','$2b$10$v.7HS1Xnch4koaF705/ZpeI5W73gJB7xzyWVAErZ1zJ6xihj.j3Dq',NULL,'2026-08-13 12:11:51','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(9,'sai','sai@gmail.com','$2b$10$vwgDRHnEX4A7HkCq6j2STu8yf/vH7nd9X7hDarVN7df6MoDwXqr22',NULL,'2026-08-14 06:56:47','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(10,'vasu','vasu@gmail.com','$2b$10$hN31SyXdtDIut8FMuY2tSe.DJP8MrDnZ7EBMQzB.pKeoSyo9bi3f.',NULL,'2026-08-14 07:08:21','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(11,'siva','siva@gmail.com','$2b$10$e.DMd37Q9jMS9YVr0CkMWunR9.sw0Vsdv0sERoG8BepVQcGWqQ.hm','854697154','2026-08-17 04:52:12','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(12,'Devi','devi@gmail.com','$2b$10$HsHCWW62/sc4opLsBtWNiO2S./5akbFcarwRuuuHn7TbeaJU/xiFe','9000022558','2026-08-17 09:46:03','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(13,'hanuman','hanuman@gmail.com','$2b$10$M80Y3pR/ogJsQ5HMoYG4NOV9Fa054ytj7YU9Ww9fKv/Df4yvtr2gu',NULL,'2026-08-25 06:20:44','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(14,'ShopEase Merchant','merchant@shopease.com','$2b$10$SwaDy5/mvu5JS/C23C67kOiLPnW.1ud/xHzuIXsVSJQri.1WR5Pfm','9876543210','2026-08-25 07:52:48','merchant','Athyam Store',NULL,NULL,NULL,'Approved',NULL,'Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073'),(15,'ShopEase Admin','admin@shopease.com','$2b$10$hpmcvH.3x0W4xFZzL9CrZeL9oXy5S5OKvrfcdsDqvYPZ8ykP.RY7y',NULL,'2026-08-25 07:55:36','admin',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(16,'Manikanta','satyaathyam@gmail.com','$2b$10$zOpSjKT062OUKcGW/ofF4e9mBFcVQlVd84GlmR4NOnapcJkfO79hq',NULL,'2026-08-27 14:22:48','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(17,'Lahiri','lahiri@jcshub.com','$2b$10$MtO6bfxgRIJ4QMwR4wo5quaeMeO2TdzAKV5Wgkyz7qYcc.UIekO52',NULL,'2026-08-27 15:54:05','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(18,'Harshith ','harshithnimishakavi2@gmail.com','$2b$10$cCEGDR/btDLux/0bpBcuteump88K3zVYmVGzzgGzM6jFebtRAJ2PO',NULL,'2026-08-28 18:09:00','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(19,'lapi','lapi@gmail.com','$2b$10$k1qB/HSoGKaf3kYbkROnyOu0MMp2WyGj4AG6IEAoQIngSYi98HEYm',NULL,'2026-09-15 08:07:14','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(20,'mouse','mouse@gmail.com','$2b$10$3xq8nS7ctNA4vNscDFliIuFBnPYUEMzYUpyhYdtdetxgWidQYaAwm',NULL,'2026-09-15 08:10:37','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(21,'shop','shop@gmail.com','$2b$10$w.GzeJS1uF5IFEtNfBzX1ugDPjFdjK0CGweVf6OorIR75TjzO6Z2y',NULL,'2026-09-15 08:15:30','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(22,'store','connect@gmail.com','$2b$10$0hfULBzQybHQR1S/opOCC.fqtk6zU2tB/2mVUaStkNX.5hOoliESC','9010626662','2026-09-15 08:48:21','merchant','sai',NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(23,'Bindu Athyam','type@gmail.com','$2b$10$AZA003p3EE1ZxpNXUCLjAO8SrBC.ibPrBPjzZcWHua6liYHnF0XwC','9494005400','2026-09-15 08:58:34','merchant','Hello',NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(24,'Lahiri','lahiri6114@gmail.com','$2b$10$a77PMYpQzveQQNLwCNjbl.uglzCUaxXvZyo35Ci7vVzxnsnK8j1nC',NULL,'2026-09-15 09:09:55','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(25,'veda','veda@gmail.com','$2b$10$kQ6HvZS9vNil7EzyeN4HIuUQw3NB1SFbWB/rkHKl3CJ3m4hN7s88a',NULL,'2026-09-15 11:18:21','customer',NULL,NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(26,'test1','test1@gamil.com','$2b$10$v6rjnGx/uVe9nzqoVPaHtelulKUgHDP6xAn8M9AoTTHNVJeHuPrk.','5263987410','2026-09-17 10:56:16','merchant','testing',NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(27,'lavanya','lavanya@gmail.com','$2b$10$0AXH5u.1lnHwVrMR20fqDeWYzYgGJltKY4wu488uXRGVQ.bCsaNm.','9876543210','2026-09-21 06:43:45','merchant','store',NULL,NULL,NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(28,'bata','bata@gmail.com','$2b$10$/J9a6EYmAhv1qFyDh/qgpuCRGWrCqwh9r857G5WLibMl6KLOh8G7q',NULL,'2026-09-23 09:58:38','customer',NULL,'What was the name of your first pet?','dog',NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(29,'Bunj','bunu@gmail.com','$2b$10$0goCYleQTNXbMyTETQckD.RyBlKIDMSsQ1gQx0cAkn/vm8jnAvjNS','6954872038','2026-09-23 12:02:51','customer',NULL,'What was the name of your first pet?','dog',NULL,'Approved',NULL,NULL,NULL,NULL,NULL),(30,'vekentaswara','venkata@gmail.com','$2b$10$8EbWky5SXGNN2ZknRAvDsOpvkWNhrdSkbT7eQ5Num.h4J3Goaote.','1234567890','2026-09-28 14:46:45','merchant','venkata','What was the name of your first pet?','dog','/uploads/merchant-documents/1790606805461-479209305.jpg','Approved','2026-09-28 15:23:31',NULL,NULL,NULL,NULL),(31,'Sumanth','sumanth@gmail.com','$2b$10$avs0lVsq9LGHBXt./VZEZeM22GQTFIhjP9o8yR5p828ymXRGDi/lm','6932587410','2026-09-29 07:01:40','merchant','Sumanth','What was the name of your first pet?','dog','/uploads/merchant-documents/1790665300013-770641348.jpeg','Approved','2026-09-29 07:02:17',NULL,NULL,NULL,NULL),(32,'durga','durga@gmail.com','$2b$10$pdKnk9lPKhJEMsIHCuojkukxb0DqsosuelWGwayAwLy3q5Z0M2NTy','9494005400','2026-10-29 07:07:42','merchant','durga stores','What was the name of your first pet?','dog','/uploads/merchant-documents/1793257662462-121839159.jpg','Approved','2026-10-29 07:08:28','Bharath Institute of Higher Education and Research\nSelaiyur, Tambaram','Chennai','Tamil Nadu','600073'),(33,'latha','latha@gmail.com','$2b$10$BcKwxmMMjoDjLlK2vcHjG.DJ4blMkF77ycoQoQTYwbNZSodvCnwW.','3698521475','2026-10-29 07:43:09','merchant','lathastores','What was the name of your first pet?','dog','/uploads/merchant-documents/1793259789771-438459408.jpg','Approved','2026-10-29 07:43:47','25 125 DAARA VARI STREET\r\nNEW MARKET JANGAREDDIGUDEM','Please Select','Andhra Pradesh','534447'),(34,'Bindu Athyam','bindupoornimaathyam@gmail.com','$2b$12$OU5CBEQVEpLsC5cT4Jgjo.zfz/dCbLsQaFvfKDgwXBSoprBfAdn4e','+919010626662','2026-10-29 11:25:43','dispatch',NULL,NULL,NULL,NULL,'Approved','2026-10-29 11:50:03',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlist`
--

DROP TABLE IF EXISTS `wishlist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
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
/*!40101 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlist_items`
--

LOCK TABLES `wishlist_items` WRITE;
/*!40000 ALTER TABLE `wishlist_items` DISABLE KEYS */;
INSERT INTO `wishlist_items` VALUES (20,9,122,'2026-10-21 14:14:08'),(22,19,140,'2026-10-26 12:28:07'),(25,19,137,'2026-10-26 12:31:04'),(26,19,141,'2026-10-26 12:31:17'),(27,19,120,'2026-10-26 12:31:35'),(28,19,139,'2026-10-26 12:31:53');
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

-- Dump completed on 2026-11-02  8:03:18
