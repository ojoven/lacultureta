<?php

namespace App\Lib;

use Xinax\LaravelGettext\Facades\LaravelGettext;

class Functions {

	/** ARRAYS **/
	public static function getArrayWithIndexValues($array, $index) {

		$arrayIndexes = array();
		foreach ($array as $element) {
			$arrayIndexes[] = $element[$index];
		}

		return $arrayIndexes;
	}

	/** LANGUAGE **/
	public static function setLocale() {

		$language = self::getUserLanguage();

		if ($language == 'eu') {
			LaravelGettext::setLocale('eu_EU');
		} else {
			LaravelGettext::setLocale('es_ES');
		}

		return $language;
	}

	public static function getUserLanguage() {

		$arrayValidLanguages = array('es', 'eu');
		$defaultLanguage = 'es'; // Ohhh zergatiiiiikk?!?!
		$language = $defaultLanguage;

		// If the user has set the language
		if (isset($_COOKIE['language']) && in_array($_COOKIE['language'], $arrayValidLanguages)) {
			$language = $_COOKIE['language'];
		}

		return $language;
	}

}

