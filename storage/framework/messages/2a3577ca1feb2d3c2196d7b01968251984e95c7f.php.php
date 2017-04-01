<?php

namespace App\Models;

/** WRAPPER FOR THE SIMPLE HTML DOM FILE **/
class SimpleHtmlDom {

	// GET HTML FROM URL
	public static function file_get_html($url) {

		$pathToSimpleHtmlDom = app_path('/Lib/Vendor/simple_html_dom.php');
		require_once $pathToSimpleHtmlDom;

		return file_get_html($url);
	}

	// GET HTML FROM STRING
	public static function str_get_html($string) {

		$pathToSimpleHtmlDom = app_path('/Lib/Vendor/simple_html_dom.php');
		require_once $pathToSimpleHtmlDom;

		return str_get_html($string);

	}


}