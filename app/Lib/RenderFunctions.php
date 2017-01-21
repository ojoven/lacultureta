<?php

namespace App\Lib;

class RenderFunctions {

	/** RENDER DATE **/
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
					return sprintf(_('desde el %s de %s hasta hoy'), $dayStart, $monthStart);
				}

				if ($diffBetweenEndAndToday == 1) {
					return sprintf(_('desde el %s de %s hasta mañana'), $dayStart, $monthStart);
				}

				if ($monthStart != $monthEnd) {
					// El 31 de Marzo y el 1 de Abril
					return sprintf(_('desde el %s de %s hasta el %s de %s'), $dayStart, $monthStart, $dayEnd, $monthEnd);
				} else {
					// El 15 y el 16 de Mayo
					return sprintf(_('desde el %s hasta el %s de %s'), $dayStart, $dayEnd, $monthStart);
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
			if ($dayStartOfTheWeek == 5 && $currentDayOfTheWeek < 5 && $diff < 7) { return _('este viernes'); }
			if ($dayStartOfTheWeek == 5 && $currentDayOfTheWeek >= 5 && $diff < 7
			|| $dayStartOfTheWeek == 5 && $currentDayOfTheWeek < 5 && $diff > 7 && $diff < 14) { return _('el viernes que viene'); }

			// ESTE SÁBADO
			if ($dayStartOfTheWeek == 6 && $currentDayOfTheWeek < 5 && $diff < 7) { return _('este sábado'); }
			if ($dayStartOfTheWeek == 6 && $currentDayOfTheWeek >= 5 && $diff < 7
			|| $dayStartOfTheWeek == 6 && $currentDayOfTheWeek < 5 && $diff > 7 && $diff < 14) { return _('el sábado que viene'); }

			// ESTE DOMINGO
			if ($dayStartOfTheWeek == 7 && $currentDayOfTheWeek < 5 && $diff < 7) { return _('este domingo'); }
			if ($dayStartOfTheWeek == 7 && $currentDayOfTheWeek == 7 && $diff < 7
			|| $dayStartOfTheWeek == 7 && $currentDayOfTheWeek < 5 && $diff > 7 && $diff < 14) { return _('el domingo que viene'); }

			// OTROS
			return sprintf(_('el %s de %s'), $dayStart, $monthStart);
		}

	}

	// MONTH NAME
	public static function getMonthName($month) {

		$arrayMonths = array(
			'1' => _('Enero'), '2' => _('Febrero'), '3' => _('Marzo'),
			'4' => _('Abril'), '5' => _('Mayo'), '6' => _('Junio'),
			'7' => _('Julio'), '8' => _('Agosto'), '9' => _('Septiembre'),
			'10' => _('Octubre'), '11' => _('Noviembre'), '12' => _('Diciembre')
		);

		return $arrayMonths[$month];
	}

	// WEEK DAY NAME
	public static function getWeekDayName($day) {

		$arrayWeekDays = array(
			'1' => _('lunes'), '2' => _('martes'), '3' => _('miércoles'),
			'4' => _('jueves'), '5' => _('viernes'), '6' => _('sábado'),
			'7' => _('domingo')
		);

		return $arrayWeekDays[$day];
	}

	/** RENDER HOUR **/
	public static function parseHourForRender($hour) {

		// Cases

		// Empty hour (no defined hours)
		if (trim($hour) == "") {
			return "";
		}

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

}

