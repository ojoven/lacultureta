<?php

namespace App\Lib;

use Xinax\LaravelGettext\Facades\LaravelGettext;
use \Rollbar\Rollbar;
use \Rollbar\Payload\Level;

class Functions {

	/** ARRAYS **/
	public static function getArrayWithIndexValues($array, $index) {

		$arrayIndexes = array();
		foreach ($array as $element) {
			$arrayIndexes[] = $element[$index];
		}

		return $arrayIndexes;
	}

	public static function strpos_array($haystack, $needles, $offset = 0) {
		if (is_array($needles)) {
			foreach ($needles as $needle) {
				$pos = self::strpos_array($haystack, $needle);
				if ($pos !== false) {
					return $pos;
				}
			}
			return false;
		} else {
			return strpos($haystack, $needles, $offset);
		}
	}

	public static function parseStringParamsToArray($params) {

		$newParams = array();
		foreach ($params as $index => $paramString) {
			$newParams[$index] = array($paramString);
		}

		return $newParams;
	}

	/** LANGUAGE **/
	public static function setLocale($languageFromBrowserUrl) {

		$language = self::getUserLanguage($languageFromBrowserUrl);

		if ($language == 'eu') {
			LaravelGettext::setLocale('eu_EU');
		} else {
			LaravelGettext::setLocale('es_ES');
		}

		return $language;
	}

	public static function getUserLanguage($language = false) {

		if (!$language) {
			$language = (LaravelGettext::getLocale() === 'eu_EU') ? 'eu' : 'es';
		}
		$arrayValidLanguages = array('es', 'eu');

		// If the user has set the language
		if (isset($_COOKIE['language']) && in_array($_COOKIE['language'], $arrayValidLanguages)) {
			$language = $_COOKIE['language'];
		}

		return $language;
	}

	public static function setLocaleFromLanguage($language) {

		if ($language == 'eu') {
			LaravelGettext::setLocale('eu_EU');
		} else {
			LaravelGettext::setLocale('es_ES');
		}

		return $language;
	}

	/** STRINGS **/
	public static function fullTrim($string) {

		$string = str_replace('&nbsp;', ' ', $string);
		return trim($string);

	}

	public static function get_string_between($string, $start, $end) {
		$string = ' ' . $string;
		$ini = strpos($string, $start);
		if ($ini == 0) return '';
		$ini += strlen($start);
		$len = strpos($string, $end, $ini) - $ini;
		return substr($string, $ini, $len);
	}

	public static function remove3and4bytesCharFromUtf8Str($str) {
		return preg_replace('/([\xF0-\xF7]...)|([\xE0-\xEF]..)/s', '#', $str);
	}

	/** JSON **/
	public static function isJson($json) {

		json_decode($json);
		return (json_last_error() == JSON_ERROR_NONE);
	}

	/** LOG **/
	public static function log($message) {

		if (is_string($message)) {
			echo $message;
		} else {
			print_r($message);
		}

		echo PHP_EOL;
	}

	public static function logToRollbar($message, $type = 'info') {

		$message = (is_string($message)) ? $message : json_encode($message);

		if ($type === 'error') {
			Rollbar::log(Level::error(), $message);
		} else {
			Rollbar::log(Level::info(), $message);
		}
	}

	/** URLS **/
	public static function getURLRequest($url) {

		$options  = array('http' => array('user_agent' => 'LaCulturetaFriendlyBot - https://lacultureta.com'));
		$context  = stream_context_create($options);
		$response = file_get_contents($url, false, $context);
		return $response;

	}
}

