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

	public static function isSingleDayEvent($event) {

		return (!$event['date_end'] || $event['date_start'] == $event['date_end']);
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

	public static function dateRange($first, $last, $step = '+1 day', $output_format = 'Y-m-d') {

		$dates = array();
		$current = strtotime($first);
		$last = strtotime($last);

		while ($current <= $last) {

			$dates[] = date($output_format, $current);
			$current = strtotime($step, $current);
		}

		return $dates;
	}

	/** SCRAPING **/
	public static function parseDatesMonth3DigitToMySQLDate(&$dateStart, &$dateEnd, $language) { // @codingStandardsIgnoreLine: MySQL is CamelCase

		$dateStart = trim($dateStart);
		if ($dateEnd) $dateEnd = trim($dateEnd);
		if ($dateEnd === $dateStart || !$dateEnd) $dateEnd = null;

		if ($language == 'es') {
			$arrayConversion = array(
				'ene' => 1, 'feb' => 2, 'mar' => 3, 'abr' => 4, 'may' => 5, 'jun' => 6,
				'jul' => 7, 'ago' => 8, 'sep' => 9, 'oct' => 10, 'nov' => 11, 'dic' => 12,
			);
		} else { // language = eu
			$arrayConversion = array(
				'Urt' => 1, 'Ots' => 2, 'Mar' => 3, 'Api' => 4, 'Mai' => 5, 'Eka' => 6,
				'Uzt' => 7, 'Abu' => 8, 'Ira' => 9, 'Urr' => 10, 'Aza' => 11, 'Abe' => 12,
			);
		}


		// DATE START
		$dateStartArray = explode(' ', $dateStart);
		if ($language == 'eu') { // In basque, the array is in inverse order
			$dateStartArray = array_reverse($dateStartArray);
		}
		$yearStart = date('Y');
		$monthStart = isset($arrayConversion[trim($dateStartArray[1])]) ? $arrayConversion[trim($dateStartArray[1])] : 1;
		$dayStart = trim($dateStartArray[0]);

		// DATE END
		if ($dateEnd) {
			$dateEndArray = explode(' ', $dateEnd);
			if ($language == 'eu') { // In basque, the array is in inverse order
				$dateEndArray = array_reverse($dateEndArray);
			}
			$yearEnd = date('Y');
			$monthEnd = isset($arrayConversion[trim($dateEndArray[1])]) ? $arrayConversion[trim($dateEndArray[1])] : 1;
			$dayEnd = trim($dateEndArray[0]);
		}

		// Special cases
		// 1. Start date is on next year (Ex: 05 Ene (2017) -> scraped on 30 Dec 2016)
		$currentMonth = (int) date('m');
		if ($currentMonth > $monthStart && (!$dateEnd || $monthEnd < $currentMonth)) {
			$yearStart++;
			if (isset($yearEnd)) {
				$yearEnd++;
			}
		}

		// Start date is previous year (Ex: 30 Dec (2016) -> scraped on 05 Ene 2017)
		// This will happen only if there's date end
		if ($dateEnd && $monthStart > $monthEnd) {
			$yearStart--;
		}

		// DATE START
		$monthStartFormatted = str_pad($monthStart, 2, "0", STR_PAD_LEFT);
		$dayStartFormatted = str_pad($dayStart, 2, "0", STR_PAD_LEFT);
		$dateStart = $yearStart . '-' . $monthStartFormatted . '-' . $dayStartFormatted;

		// DATE END
		if ($dateEnd) {
			$monthEndFormatted = str_pad($monthEnd, 2, "0", STR_PAD_LEFT);
			$dayEndFormatted = str_pad($dayEnd, 2, "0", STR_PAD_LEFT);
			$dateEnd = ($dateEnd) ? $yearEnd . '-' . $monthEndFormatted . '-' . $dayEndFormatted : null;
		}

	}

	/** WEEKDAY **/
	public static function getThisWeekDayDate($day) {

		if (date("w")==1) {
			$start_monday = date("Y-m-d");
		} else {
			$start_monday = date("Y-m-d", strtotime('last monday'));
		}

		$thisWeekDay = date("Y-m-d", strtotime($start_monday.' this ' . $day)); // this friday, for example
		return $thisWeekDay;
	}

}

