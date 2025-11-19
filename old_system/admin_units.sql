-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Nov 19, 2025 at 04:19 PM
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
-- Table structure for table `admin_units`
--

CREATE TABLE `admin_units` (
  `admin_unit_id` int(2) UNSIGNED ZEROFILL NOT NULL,
  `admin_unit_fullName` varchar(20) NOT NULL,
  `admin_unit_shortName` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin_units`
--

INSERT INTO `admin_units` (`admin_unit_id`, `admin_unit_fullName`, `admin_unit_shortName`) VALUES
(01, '院本部', '院本部'),
(02, '課務組', '課務組'),
(03, '心智中心', '心智中心'),
(04, '師培中心', '師培中心'),
(06, '華德福中心', '華德福中心'),
(07, '特教中心', '特教中心'),
(11, '心理諮商系', '心諮系'),
(12, '特教系', '特教系'),
(13, '幼教系', '幼教系'),
(14, '運科系', '運科系'),
(15, '環文系', '環文系'),
(16, '教科系', '教科系'),
(17, '數理系', '數理系'),
(18, '英教系', '英教系'),
(19, '數理所', '數理所'),
(20, '台語所', '台語所');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin_units`
--
ALTER TABLE `admin_units`
  ADD PRIMARY KEY (`admin_unit_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admin_units`
--
ALTER TABLE `admin_units`
  MODIFY `admin_unit_id` int(2) UNSIGNED ZEROFILL NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
