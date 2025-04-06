<?php

namespace App\Lib;

class RenderFunctions
{

	/** RENDER DATE **/
	public static function parseDateForRender($dateStart, $dateEnd)
	{

		$currentDate = date('Y-m-d');

		$currentDateObj = new \DateTime($currentDate);
		$dateStartObj = new \DateTime($dateStart);
		$dayStart = date('j', strtotime($dateStart));
		$dayNameStart = self::getWeekDayName((int)date('N', strtotime($dateStart)));
		$dayStartOfTheWeek = (int)date('N', strtotime($dateStart));
		$currentDayOfTheWeek = (int)date('N', strtotime($currentDate));
		$monthStart = self::getMonthName((int)date('n', strtotime($dateStart)));

		$diff = (int) $currentDateObj->diff($dateStartObj)->format("%r%a");

		if ($dateEnd == $dateStart) $dateEnd = null; // No range if date end equals to date start

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
				if ($diffBetweenEndAndToday == 0) {
					return __('ayer y hoy');
				}

				// HOY Y MAÑANA
				if ($diffBetweenEndAndToday == 1) {
					return __('hoy y mañana');
				}

				// MAÑANA Y PASADO
				if ($diffBetweenEndAndToday == 2) {
					return __('mañana y pasado');
				}

				// OTROS
				if ($monthStart != $monthEnd) {
					// El 31 de Marzo y el 1 de Abril
					return __('el %1$s de %2$s y el %3$s de %4$s', [$dayStart, $monthStart, $dayEnd, $monthEnd]);
				} else {
					// El 15 y el 16 de Mayo
					return __('el %1$s y el %2$s de %3$s', [$dayStart, $dayEnd, $monthStart]);
				}
			} else {

				// Difference between dates > 1

				// HASTA HOY / MAÑANA
				if ($diffBetweenEndAndToday == 0) {
					return sprintf(__('desde el %1$s de %2$s hasta hoy'), $dayStart, $monthStart);
				}

				if ($diffBetweenEndAndToday == 1) {
					return sprintf(__('desde el %1$s de %2$s hasta mañana'), $dayStart, $monthStart);
				}

				if ($monthStart != $monthEnd) {
					// El 31 de Marzo y el 1 de Abril
					return sprintf(__('desde el %1$s de %2$s hasta el %3$s de %4$s'), $dayStart, $monthStart, $dayEnd, $monthEnd);
				} else {
					// El 15 y el 16 de Mayo
					return sprintf(__('desde el %1$s hasta el %2$s de %3$s'), $dayStart, $dayEnd, $monthStart);
				}
			}
		} else {

			// NO DATE END
			// HOY
			if ($diff == 0) {
				return __('hoy');
			}

			// MAÑANA
			if ($diff == 1) {
				return __('mañana') .  ' ' . $dayNameStart;
			}

			// PASADO
			if ($diff == 2) {
				return __('pasado mañana') . ' ' . $dayNameStart;
			}

			// OTROS
			return __('el %1$s, %2$s de %3$s', [$dayNameStart, $dayStart, $monthStart]);
		}
	}

	public static function renderDateWeekdayNameDayAndMonth($date)
	{

		$strtotime = strtotime($date);
		$render = '';
		$dayWeek = ucfirst(self::getWeekDayName((int)date('N', $strtotime))); // Lunes
		$dayMonth = date('d', $strtotime); // 05
		$month = self::getMonthName((int)date('n', $strtotime)); // Mayo
		$render .= __('%1$s %2$s de %3$s', [$dayWeek, $dayMonth, $month]);

		return $render;
	}

	// MONTH NAME
	public static function getMonthName($month)
	{

		$arrayMonths = array(
			'1' => __('Enero'),
			'2' => __('Febrero'),
			'3' => __('Marzo'),
			'4' => __('Abril'),
			'5' => __('Mayo'),
			'6' => __('Junio'),
			'7' => __('Julio'),
			'8' => __('Agosto'),
			'9' => __('Septiembre'),
			'10' => __('Octubre'),
			'11' => __('Noviembre'),
			'12' => __('Diciembre')
		);

		return $arrayMonths[$month];
	}

	// WEEK DAY NAME
	public static function getWeekDayName($day)
	{

		$arrayWeekDays = array(
			'1' => __('lunes'),
			'2' => __('martes'),
			'3' => __('miércoles'),
			'4' => __('jueves'),
			'5' => __('viernes'),
			'6' => __('sábado'),
			'7' => __('domingo')
		);

		return $arrayWeekDays[$day];
	}

	/** RENDER HOUR **/
	public static function parseHourForRender($hour)
	{

		// Cases

		// Empty hour (no defined hours)
		if (trim($hour) == "" || $hour == ' ' || $hour == '&nbsp;') {
			return "";
		}

		// + (different hours)
		if (strpos($hour, '+') !== false) {
			$hours = explode('+', $hour);
			if (count($hours) == 2) {
				return sprintf(__('a las %s y a las %s'), $hours[0], $hours[1]);
			}
		}

		// - (range hours)
		if (strpos($hour, '-') !== false) {
			$hours = explode('-', $hour);
			if (count($hours) == 2) {
				return sprintf(__('desde las %s hasta las %s'), $hours[0], $hours[1]);
			}
		}

		// + (different hours, called: varios)
		if (strpos($hour, 'Varios') !== false || strpos($hour, 'Hainbat') !== false) {
			return __('a diferentes horas');
		}

		$hourRender = sprintf(__('a las %s'), $hour);
		return $hourRender;
	}

	/** PRICE **/
	public static function parsePriceForRender($price)
	{

		if ($price == '0 €') {
			return __('gratis');
		} else {
			return $price;
		}
	}

	/** CATEGORIES **/
	public static function parseCategoriesForRender($categories)
	{

		$categories = explode(',', $categories);
		return $categories;
	}
}
