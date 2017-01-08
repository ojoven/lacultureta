<?php

namespace App\Lib;

class Functions {

	// DATE RELATED
	public static function parseDateForRender($dateStart, $dateEnd) {

		$currentDate = date('Y-m-d');

		$currentDateObj = new \DateTime($currentDate);
		$dateStartObj = new \DateTime($dateStart);
		$dayStart = date('j', strtotime($dateStart));
		$dayStartOfTheWeek = (int)date('N', strtotime($dateStart));
		$currentDayOfTheWeek = (int)date('N', strtotime($currentDate));
		$monthStart = self::getMonthName((int)date('n', strtotime($dateStart)));

		$diff = (int) $currentDateObj->diff($dateStartObj)->format("%r%a");

		// Cases

		// WITH DATE END
		if ($dateEnd) {
			$dateEndObj = new \DateTime($dateEnd);
			$dayEnd = date('j', strtotime($dateEnd));
			$monthEnd = self::getMonthName((int)date('n', strtotime($dateEnd)));

			// IF Difference between dates is small (1 day)
			$diffBetweenStartAndEnd = (int) $dateStartObj->diff($dateEndObj)->format("%r%a");
			$diffBetweenEndAndToday = (int) $dateEndObj->diff($currentDateObj)->format("%r%a");

			if ($diffBetweenStartAndEnd == 1) {

				// AYER Y HOY
				if ($diffBetweenEndAndToday == 0) { return _('ayer y hoy'); }

				// HOY Y MAÑANA
				if ($diffBetweenEndAndToday == 1) { return _('hoy y mañana'); }

				// MAÑANA Y PASADO
				if ($diffBetweenEndAndToday == 2) { return _('mañana y pasado'); }

				// OTROS
				if ($monthStart != $monthEnd) {
					// El 31 de Marzo y el 1 de Abril
					return sprintf(_('el %s de %s y el %s de %s'), $dayStart, $monthStart, $dayEnd, $monthEnd);
				} else {
					// El 15 y el 16 de Mayo
					return sprintf(_('el %s y el %s de %s'), $dayStart, $dayEnd, $monthStart);
				}

			} else {

				// Difference between dates > 1

				// HASTA HOY / MAÑANA
				if ($diffBetweenEndAndToday == 0) {
					return sprintf(_('del %s de %s hasta hoy'), $dayStart, $monthStart);
				}

				if ($diffBetweenEndAndToday == 1) {
					return sprintf(_('del %s de %s hasta mañana'), $dayStart, $monthStart);
				}

				if ($monthStart != $monthEnd) {
					// El 31 de Marzo y el 1 de Abril
					return sprintf(_('del %s de %s hasta el %s de %s'), $dayStart, $monthStart, $dayEnd, $monthEnd);
				} else {
					// El 15 y el 16 de Mayo
					return sprintf(_('del %s hasta el %s de %s'), $dayStart, $dayEnd, $monthStart);
				}


			}

		} else {

			// NO DATE END
			// HOY
			if ($diff == 0) { return _('hoy'); }

			// MAÑANA
			if ($diff == 1) { return _('mañana'); }

			// PASADO
			if ($diff == 2) { return _('pasado mañana'); }

			if ($diff < 5) {
				return sprintf(_('este %s'), self::getWeekDayName($dayStartOfTheWeek));
			}

			// ESTE VIERNES / VIERNES QUE VIENE
			if ($dayStartOfTheWeek == 5 && $currentDayOfTheWeek < 5) { return _('este viernes'); }
			if ($dayStartOfTheWeek == 5 && $currentDayOfTheWeek >= 5) { return _('el viernes que viene'); }

			// ESTE SÁBADO
			if ($dayStartOfTheWeek == 6 && $currentDayOfTheWeek < 5) { return _('este sábado'); }
			if ($dayStartOfTheWeek == 6 && $currentDayOfTheWeek >= 5) { return _('el sábado que viene'); }

			// ESTE DOMINGO
			if ($dayStartOfTheWeek == 7 && $currentDayOfTheWeek < 5) { return _('este domingo'); }
			if ($dayStartOfTheWeek == 7 && $currentDayOfTheWeek == 7) { return _('el domingo que viene'); }

			// OTROS
			return sprintf(_('el %s de %s'), $dayStart, $monthStart);
		}

	}

	public static function getMonthName($month) {

		$arrayMonths = array(
			'1' => _('Enero'), '2' => _('Febrero'), '3' => _('Marzo'),
			'4' => _('Abril'), '5' => _('Mayo'), '6' => _('Junio'),
			'7' => _('Julio'), '8' => _('Agosto'), '9' => _('Septiembre'),
			'10' => _('Octubre'), '11' => _('Noviembre'), '12' => _('Diciembre')
		);

		return $arrayMonths[$month];
	}

	public static function getWeekDayName($day) {

		$arrayWeekDays = array(
			'1' => _('lunes'), '2' => _('martes'), '3' => _('miércoles'),
			'4' => _('jueves'), '5' => _('viernes'), '6' => _('sábado'),
			'7' => _('domingo')
		);

		return $arrayWeekDays[$day];
	}

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

	// HOUR
	public static function parseHourForRender($hour) {

		// Cases
		// + (different hours)
		if (strpos($hour, '+')!==false) {
			$hours = explode('+', $hour);
			if (count($hours)==2) {
				return sprintf(_('a las %s y a las %s'), $hours[0], $hours[1]);
			}
		}

		// - (range hours)
		if (strpos($hour, '-')!==false) {
			$hours = explode('-', $hour);
			if (count($hours)==2) {
				return sprintf(_('desde las %s hasta las %s'), $hours[0], $hours[1]);
			}
		}

		$hourRender = sprintf(_('a las %s'), $hour);
		return $hourRender;

	}

	/** PRICE **/
	public static function parsePriceForRender($price) {

		if ($price == '0 €') {
			return _('gratis');
		} else {
			return $price;
		}

	}

	/** CATEGORIES **/
	public static function parseCategoriesForRender($categories) {

		$categories = explode(',', $categories);
		return $categories;

	}

	/** ARRAYS **/
	public static function getArrayWithIndexValues($array, $index) {

		$arrayIndexes = array();
		foreach ($array as $element) {
			$arrayIndexes[] = $element[$index];
		}

		return $arrayIndexes;
	}

}

