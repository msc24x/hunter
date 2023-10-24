CREATE TABLE `competitions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `host_user_id` int DEFAULT NULL,
  `title` varchar(120) DEFAULT NULL,
  `description` varchar(456) DEFAULT NULL,
  `created_on` datetime DEFAULT NULL,
  `rating` int DEFAULT '0',
  `public` tinyint(1) DEFAULT NULL,
  `duration` int DEFAULT '0',
  `start_schedule` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=227 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
