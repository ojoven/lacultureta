<?php

namespace App\Lib;

class Functions {

	public static function parseDatesMonth3DigitToMySQLDate(&$dateStart, &$dateEnd) {

		$arrayConversion = array(
			'Ene' => 1,
			'Feb' => 2,
			'Mar' => 3,
			'Abr' => 4,
			'May' => 5,
			'Jun' => 6,
			'Jul' => 7,
			'Ago' => 8,
			'Sep' => 9,
			'Oct' => 10,
			'Nov' => 11,
			'Dic' => 12,
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
		$dateEnd = ($dateEnd) ? $yearStart . '-' . str_pad($monthEnd, 2, "0", STR_PAD_LEFT) . '-' . str_pad($dayEnd, 2, "0", STR_PAD_LEFT) : null;

	}

	public static function getArrayWithIndexValues($array, $index) {

		$arrayIndexes = array();
		foreach ($array as $element) {
			$arrayIndexes[] = $element[$index];
		}

		return $arrayIndexes;
	}

}

