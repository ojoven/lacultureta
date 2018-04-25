<?php

namespace App\Models;

use App\Lib\Functions;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Model;

class Scraper extends Model {

	public function extractDataEvents() {

		set_time_limit(0);

		// We define the sources from where the system will read
		//$sources = array('DonostiaEus');
		//$sources = array('FacebookEvents');
		$sources = array('DonostiaEus', 'FacebookEvents');

		foreach ($sources as $source) {

			$sourceModel = $this->loadSourceModel($source);
			if (!$sourceModel) {
				continue;
			}

			// We get the events from the defined source
			$events = $sourceModel->getDataEvents();
			$this->storeEvents($events, $source);
		}

		return false;

	}

	public function loadSourceModel($source) {

		$pathToSource = dirname(dirname(__FILE__)) . '/Sources/' . $source . '.php';
		if (file_exists($pathToSource)) {
			require_once($pathToSource);

			$sourceModel = new $source();
			return $sourceModel;
		}

		return false;
	}

	public function storeEvents($events, $source) {

		Functions::log('Store events ' . $source);
		if ($events) {
			DB::table('events')->insert($events);
		}

		//Functions::logToRollbar('Scraper run! New events (' . count($events) . ') stored for ' . $source);

	}

}