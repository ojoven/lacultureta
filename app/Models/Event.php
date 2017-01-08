<?php

namespace App\Models;
use App\Lib\Functions;
use Illuminate\Database\Eloquent\Model;

class Event extends Model {

	public function getInitialEvents() {

		$events = self::get()->toArray();
		$events = $this->parseEventsForRender($events);
		$events = array_slice($events, 0, 20);
		return $events;

	}

	public function parseEventsForRender($events) {

		foreach ($events as &$event) {

			$event['date_render'] = Functions::parseDateForRender($event['date_start'], $event['date_end']);
			$event['hour_render'] = Functions::parseHourForRender($event['hour']);
			$event['price_render'] = Functions::parsePriceForRender($event['price']);
			$event['categories_render'] = Functions::parseCategoriesForRender($event['categories']);

		}

		return $events;

	}

}