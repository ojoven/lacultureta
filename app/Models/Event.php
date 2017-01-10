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
		$events = self::whereDate('date_start', '>=', $today)->orWhereDate('date_end', '>=', $today)->orderBy('date_start', 'asc')->get()->toArray();
		$events = $this->sortEvents($events);
		$events = array_slice($events, $offset, $this->numEventsPage);
		$events = $this->parseEventsForRender($events);
		return $events;

	}

	public function sortEvents($events) {

		$eventsUnique = array();
		$eventsRange = array();

		foreach ($events as $event) {

			if (!$event['date_end']) {
				array_push($eventsUnique, $event);
			} else {

				$dateStartObj = new \DateTime($event['date_start']);
				$dateEndObj = new \DateTime($event['date_end']);
				$diff = (int) $dateStartObj->diff($dateEndObj)->format("%r%a");

				// The events that have a range of less than 10 days are considered as unique too
				if ($diff < 10) {
					array_push($eventsUnique, $event);
				} else {
					array_push($eventsRange, $event);
				}

			}
		}

		// Now we merge, first unique
		$sortedEvents = array_merge($eventsUnique, $eventsRange);

		return $sortedEvents;

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