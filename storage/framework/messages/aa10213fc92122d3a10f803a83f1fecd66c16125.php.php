<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Place extends Model {

	public function getPlaces() {

		$eventModel = new Event();
		$events = $eventModel->getAllEvents();

		$arrayPlaces = $places = array();
		foreach ($events as $event) {

			if (!isset($arrayPlaces[$event['place']])) {
				$arrayPlaces[$event['place']] = 1;
			} else {
				$arrayPlaces[$event['place']]++;
			}

		}

		// We sort them by number of events
		arsort($arrayPlaces);

		// We make it associative array
		foreach ($arrayPlaces as $place => $numEvents) {
			$placeObj['name'] = $place;
			$placeObj['numEvents'] = $numEvents;
			$places[] = $placeObj;
		}

		return $places;
	}

}