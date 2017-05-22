<?php

namespace App\Lib;
use App\Lib\Functions;

class CacheFunctions {

	/** GET CACHE KEY FOR EVENT BASED ON PARAMS **/
	public static function getCacheKeyParams($params) {

		$params['language'] = Functions::getUserLanguage();
		$separator = '_';
		$cacheKey = '';

		foreach ($params as $index => $param) {
			$paramString = (is_array($param)) ? implode($separator, $param) : $param;
			$cacheKey .= $index . $separator . $paramString . $separator;
		}

		return $cacheKey;
	}

	/** GET CACHE KEY FOR EVENT LIKE RATINGS **/
	public static function getCacheLikeRatings($eventId) {

		$cacheKey = 'likes_' . $eventId;
		return $cacheKey;
	}

}

