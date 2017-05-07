<?php

namespace App\Lib;

class CacheFunctions {

	public static function getCacheKeyParams($params) {

		$separator = '_';
		$cacheKey = '';

		foreach ($params as $index => $param) {
			$paramString = (is_array($param)) ? implode($separator, $param) : $param;
			$cacheKey .= $index . $separator . $paramString . $separator;
		}

		return $cacheKey;
	}

}

