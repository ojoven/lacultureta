<?php

namespace App\Models;
use App\Lib\Functions;
use Illuminate\Database\Eloquent\Model;

class Event extends Model {

	protected $numEventsPage = 10;

	public function getEvents($params) {

		$page = $params['page'];
		$offset = ($page - 1) * $this->numEventsPage;

		$today = date('Y-m-d');
		$events = self::whereDate('date_start', '>', $today)->orWhereDate('date_end', '>', $today)->skip($offset)->take($this->numEventsPage)->get()->toArray();
		$events = $this->parseEventsForRender($events);
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