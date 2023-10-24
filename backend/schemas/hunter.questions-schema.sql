CREATE TABLE `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `competition_id` int NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `statement` varchar(2048) DEFAULT NULL,
  `points` int DEFAULT '0',
  `date_created` datetime DEFAULT NULL,
  `sample_cases` varchar(250) DEFAULT NULL,
  `sample_sols` varchar(250) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_cid` (`competition_id`)
) ENGINE=InnoDB AUTO_INCREMENT=96 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
