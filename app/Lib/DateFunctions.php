<?php

namespace App\Lib;

class DateFunctions {

	/** DATE DIFFERENCE **/
	public static function getNumOfDaysFromDate1ToDate2($date1, $date2) {

		$date1Object = new \DateTime($date1);
		$date2Object = new \DateTime($date2);
		$diff = (int) $date1Object->diff($date2Object)->format("%r%a");

		return $diff;
	}

	public static function doesEventHappenInDate($event, $date) {

		$daysFromEventStartToDate = self::getNumOfDaysFromDate1ToDate2($event['date_start'], $date);
		$daysFromDateToEventEnd = self::getNumOfDaysFromDate1ToDate2($date, $event['date_end'], $date);

		if ($daysFromEventStartToDate == 0 // The event happens the same date
		|| ($daysFromEventStartToDate > 0 && $daysFromDateToEventEnd >= 0)) { // The date is between event start / end
			return true;
		}

		return false;
	}

	public static function dateRange($first, $last, $step = '+1 day', $output_format = 'Y-m-d' ) {

		$dates = array();
		$current = strtotime($first);
		$last = strtotime($last);

		while( $current <= $last ) {

			$dates[] = date($output_format, $current);
			$current = strtotime($step, $current);
		}

		return $dates;
	}

	/** SCRAPING **/
	public static function parseDatesMonth3DigitToMySQLDate(&$dateStart, &$dateEnd) {

		$arrayConversion = array(
			'Ene' => 1, 'Feb' => 2, 'Mar' => 3, 'Abr' => 4, 'May' => 5, 'Jun' => 6,
			'Jul' => 7, 'Ago' => 8, 'Sep' => 9, 'Oct' => 10, 'Nov' => 11, 'Dic' => 12,
		);

		// DATE START
		$dateStartArray = explode(' ', $dateStart);
		$yearStart = date('Y');
		$monthStart = isset($arrayConversion[trim($dateStartArray[1])]) ? $arrayConversion[trim($dateStartArray[1])] : 1;
		$dayStart = trim($dateStartArray[0]);

		// DATE END
		if ($dateEnd) {
			$dateEndArray = explode(' ', $dateEnd);
			$yearEnd = date('Y');
			$monthEnd = isset($arrayConversion[trim($dateEndArray[1])]) ? $arrayConversion[trim($dateEndArray[1])] : 1;
			$dayEnd = trim($dateEndArray[0]);
		}

		// Special cases
		// 1. Start date is on next year (Ex: 05 Ene (2017) -> scraped on 30 Dec 2016)
		$currentMonth = date('m');
		if ($currentMonth > $monthStart && (!$dateEnd || $monthEnd < $currentMonth)) {
			$yearStart++;
		}

		// Start date is previous year (Ex: 30 Dec (2016) -> scraped on 05 Ene 2017)
		// This will happen only if there's date end
		if ($dateEnd && $monthStart > $monthEnd) {
			$yearStart--;
		}

		// DATE START
		$dateStart = $yearStart . '-' . str_pad($monthStart, 2, "0", STR_PAD_LEFT) . '-' . str_pad($dayStart, 2, "0", STR_PAD_LEFT);

		// DATE END
		$dateEnd = ($dateEnd) ? $yearEnd . '-' . str_pad($monthEnd, 2, "0", STR_PAD_LEFT) . '-' . str_pad($dayEnd, 2, "0", STR_PAD_LEFT) : null;

	}

}

