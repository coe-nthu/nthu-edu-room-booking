-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 19, 2025 at 03:43 PM
-- Server version: 10.6.22-MariaDB-0ubuntu0.22.04.1
-- PHP Version: 8.1.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `laravel`
--

-- --------------------------------------------------------

--
-- Table structure for table `spaces`
--

CREATE TABLE `spaces` (
  `space_id` int(11) NOT NULL COMMENT '空間名稱(含位置)',
  `space_code` varchar(10) NOT NULL COMMENT '教室編號',
  `space_name` varchar(50) DEFAULT NULL,
  `floor` enum('B1F','1F','2F','3F','4F','5F','6F','7F','8F') DEFAULT NULL COMMENT '樓層',
  `space_type` enum('Teaching','Meeting','Research','Other') DEFAULT 'Teaching',
  `space_status` set('Allow','Deny') DEFAULT NULL,
  `picture` varchar(50) DEFAULT NULL,
  `time_unit` enum('Hour','Period') DEFAULT NULL COMMENT '計時單位',
  `user_comm` varchar(50) DEFAULT NULL COMMENT '空間管理人聯繫資訊',
  `max_num` int(11) DEFAULT NULL COMMENT '可容納人數',
  `other_equ` varchar(200) DEFAULT NULL COMMENT '設備',
  `admin_unit` varchar(50) DEFAULT NULL COMMENT '空間管理單位',
  `timetable` tinytext DEFAULT NULL COMMENT '課表',
  `timeTable_detail` text DEFAULT NULL,
  `noon_deny` set('True','False') NOT NULL DEFAULT 'False',
  `admin_user` int(11) NOT NULL COMMENT '空間管理人姓名',
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `spaces`
--

INSERT INTO `spaces` (`space_id`, `space_code`, `space_name`, `floor`, `space_type`, `space_status`, `picture`, `time_unit`, `user_comm`, `max_num`, `other_equ`, `admin_unit`, `timetable`, `timeTable_detail`, `noon_deny`, `admin_user`, `created_at`, `updated_at`) VALUES
(2, 'B111', '國際會議廳', 'B1F', 'Meeting', NULL, NULL, NULL, '61007', 150, NULL, '1', '', NULL, 'False', 2, '2022-09-12 18:42:57', '2025-05-15 08:28:38'),
(5, 'B117', '舞蹈教室', 'B1F', 'Teaching', NULL, NULL, NULL, '61007', 30, NULL, '14', 'M1', NULL, 'False', 2, '2023-04-10 06:59:53', '2025-05-15 08:32:51'),
(6, 'B116', '舞蹈教室', 'B1F', 'Teaching', NULL, NULL, NULL, '61007', 30, NULL, '14', 'M1,T1,W1,R1,F1,S1,U1,M2,M3,M4,Mn,M5,M6,M7,M8,M9,Ma,Mb,Mc,Md', NULL, 'False', 2, '2022-09-30 06:57:39', '2025-05-15 08:32:07'),
(7, 'B102B', '環境教室', 'B1F', 'Teaching', 'Allow', NULL, NULL, '61007', 120, NULL, '1', '周一二四五ALL\r\n三13:00-17:00', 'M1,M2,M3,M4,Mn,M5,M6,M7,M8,M9,Ma,Mb,Mc,Md,T1,T2,T3,T4,Tn,T5,T6,T7,T8,T9,Ta,Tb,Tc,Td,Wn,W5,W6,W7,W8,R1,R2,R3,R4,Rn,R5,R6,R7,R8,R9,Ra,Rb,Rc,Rd,F1,F2,F3,F4,Fn,F5,F6,F7,F8,F9,Fa,Fb,Fc,Fd,S1,S2,S3,S4,Sn,S5,S6,S7,S8,S9,Sa,Sb,Sc,Sd,U1,U2,U3,U4,Un,U5,U6,U7,U8,U9,Ua,Ub,Uc,Ud', 'False', 2, '2025-05-15 07:00:50', '2025-05-15 07:14:38'),
(8, 'B103', '普通教室', 'B1F', 'Teaching', NULL, NULL, NULL, '61007', 40, NULL, '13', '', NULL, 'False', 2, '2025-05-15 08:02:41', '2025-05-15 08:03:01'),
(9, 'B108', '保育教室', 'B1F', 'Teaching', NULL, NULL, NULL, '61007', 40, NULL, '13', NULL, NULL, 'False', 2, '2025-05-15 08:26:08', '2025-05-15 08:26:08'),
(10, 'B109', '創客空間', 'B1F', 'Teaching', 'Allow', NULL, NULL, '61007', 40, NULL, '1', 'All', 'M1,M2,M3,M4,Mn,M5,M6,M7,M8,M9,Ma,Mb,Mc,Md,T1,T2,T3,T4,Tn,T5,T6,T7,T8,T9,Ta,Tb,Tc,Td,W1,W2,W3,W4,Wn,W5,W6,W7,W8,W9,Wa,Wb,Wc,Wd,R1,R2,R3,R4,Rn,R5,R6,R7,R8,R9,Ra,Rb,Rc,Rd,F1,F2,F3,F4,Fn,F5,F6,F7,F8,F9,Fa,Fb,Fc,Fd,S1,S2,S3,S4,Sn,S5,S6,S7,S8,S9,Sa,Sb,Sc,Sd,U1,U2,U3,U4,Un,U5,U6,U7,U8,U9,Ua,Ub,Uc,Ud', 'False', 2, '2025-05-15 08:27:13', '2025-05-15 08:27:13'),
(11, '102', '微觀教室', '1F', 'Teaching', NULL, NULL, NULL, '61007', 40, NULL, '4', NULL, NULL, 'False', 2, '2025-05-16 02:46:35', '2025-05-16 02:46:35'),
(12, '201', '普通教室', '2F', 'Teaching', NULL, NULL, NULL, '61007', 40, NULL, '7', NULL, NULL, 'False', 2, '2025-05-16 02:48:16', '2025-05-16 02:48:16'),
(13, '209', '普通教室', '2F', 'Teaching', NULL, NULL, NULL, '61007', 40, NULL, '11', NULL, NULL, 'False', 2, '2025-05-16 02:51:32', '2025-05-16 02:51:32'),
(14, '225', '普通教室', '2F', 'Teaching', NULL, NULL, NULL, '61007', 40, NULL, '16', NULL, NULL, 'False', 2, '2025-05-16 02:52:11', '2025-05-16 02:52:11'),
(15, '227', '音樂多功能教室兼團體動力室', '2F', 'Teaching', NULL, NULL, NULL, '61007', 40, NULL, '1', 'M2,M3,M4', NULL, 'False', 2, '2025-05-16 02:52:59', '2025-05-16 03:02:22'),
(16, '229', '普通教室-華德福情境教室', '2F', 'Teaching', NULL, NULL, NULL, '61007', 40, NULL, '4', NULL, NULL, 'False', 2, '2025-05-16 02:53:58', '2025-05-16 02:53:58'),
(17, '230', '普通教室-特教系資源教室', '2F', 'Teaching', NULL, NULL, NULL, '61007', 40, NULL, '1', NULL, NULL, 'False', 2, '2025-05-16 02:54:29', '2025-05-16 02:54:29'),
(18, '231', '普通教室-幼教系情境教室', '2F', 'Teaching', NULL, NULL, NULL, '61007', 40, NULL, '1', NULL, NULL, 'False', 2, '2025-05-16 02:54:56', '2025-05-16 02:54:56'),
(19, '234', '普通教室-教科系情境教室', '2F', 'Teaching', NULL, NULL, NULL, '61007', 40, NULL, '1', NULL, NULL, 'False', 2, '2025-05-16 02:59:01', '2025-05-16 02:59:01'),
(20, '301', '圖書室', '3F', 'Other', NULL, NULL, NULL, '61007', 40, NULL, '1', '', NULL, 'False', 2, '2025-05-19 08:51:12', '2025-05-19 08:57:23'),
(21, '302', '電腦教室', '3F', 'Teaching', NULL, NULL, NULL, '61007', 50, NULL, '1', 'T1,F1,T2,F2,T3,R3,F3,T4,R4,F4,T5,W5,R5,T6,W6,R6,M7,T7,W7,M8,T8,W8,T9,W9,Wa,Wb,Wc', NULL, 'False', 9, '2025-05-20 05:39:59', '2025-06-12 06:52:54'),
(22, '304', '碩博士研究生空間', '3F', 'Other', NULL, NULL, NULL, '61007', 50, NULL, '1', '', NULL, 'False', 2, '2025-05-20 06:34:26', '2025-05-20 06:34:53'),
(23, '305', '團體動力、諮商室', '3F', 'Teaching', NULL, NULL, NULL, '61007', 50, NULL, '1', NULL, NULL, 'False', 2, '2025-05-20 06:38:51', '2025-05-20 06:38:51'),
(24, '306', '電腦教室', '3F', 'Teaching', NULL, NULL, NULL, '61007', 32, NULL, '1', 'M1,M2,M3,M4,Mn,M5,M6,M7,M8,M9', NULL, 'False', 9, '2025-05-20 06:40:28', '2025-05-20 06:42:28'),
(25, '307', '電腦教室', '3F', 'Teaching', 'Allow', NULL, NULL, '61007', 42, NULL, '1', 'M1-9、T1-n、T6-9、W1-n、W8-d、R全天、F1-5、F9-d、Sn-d、U全天', 'M1,M2,M3,M4,Mn,M5,M6,M7,M8,M9,T1,T2,T3,T4,Tn,T6,T7,T8,T9,W1,W2,W3,W4,Wn,W8,W9,Wa,Wb,Wc,Wd,R1,R2,R3,R4,Rn,R5,R6,R7,R8,R9,Ra,Rb,Rc,Rd,F1,F2,F3,F4,Fn,F5,F9,Fa,Fb,Fc,Fd,Sn,S5,S6,S7,S8,S9,Sa,Sb,Sc,Sd,U1,U2,U3,U4,Un,U5,U6,U7,U8,U9,Ua,Ub,Uc,Ud', 'False', 9, '2025-05-20 06:46:21', '2025-05-20 06:46:41'),
(26, '318', '研討室', '3F', 'Teaching', NULL, NULL, NULL, '61007', 42, NULL, '2', NULL, NULL, 'False', 2, '2025-05-20 06:47:53', '2025-05-20 06:47:53'),
(27, '321', '實驗教室', '3F', 'Teaching', NULL, NULL, NULL, '61007', 42, NULL, '1', NULL, NULL, 'False', 2, '2025-05-20 06:53:06', '2025-05-20 06:53:06'),
(28, '322', '實驗教室', '3F', 'Teaching', NULL, NULL, NULL, '61007', 42, NULL, '1', NULL, NULL, 'False', 2, '2025-05-20 06:56:25', '2025-05-20 06:56:25');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `spaces`
--
ALTER TABLE `spaces`
  ADD PRIMARY KEY (`space_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `spaces`
--
ALTER TABLE `spaces`
  MODIFY `space_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '空間名稱(含位置)', AUTO_INCREMENT=50;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
