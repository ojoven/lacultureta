<?php

namespace App\Models;
use App\Lib\RenderFunctions;
use Illuminate\Database\Eloquent\Model;

class Event extends Model {

	protected $numEventsPage = 10;

	// All Events
	public function getAllEvents() {

		$events = self::get()->toArray();
		return $events;
	}

	// Get Events by Filter
	public function getEvents($params) {

		$page = $params['page'];
		$offset = ($page - 1) * $this->numEventsPage;
		$today = date('Y-m-d');

		$events = self::whereDate('date_start', '>=', $today)->orWhereDate('date_end', '>=', $today)->orderBy('date_start', 'asc')->get()->toArray();

		$events = $this->filterEvents($events, $params);
		$events = $this->sortEvents($events);
		$events = array_slice($events, $offset, $this->numEventsPage);
		$events = $this->parseEventsForRender($events);
		return $events;

	}

	// FILTERS
	public function filterEvents($events, $params) {

		$events = $this->filterEventsByDate($events, $params['date']);
		$events = $this->filterEventsByCategory($events, $params['category']);
		$events = $this->filterEventsByPlace($events, $params['place']);

		$events = $this->filterEventsRemoveDuplicated($events);

		return $events;
	}


	public function filterEventsByDate($events, $date) {

		// Special case, all dates
		if (in_array('all', $date)) return $events;

		$currentDate = date('Y-m-d');
		$currentDateObj = new \DateTime($currentDate);

		$eventsByDate = array();
		foreach ($events as $event) {

			$dateStartObj = new \DateTime($event['date_start']);

			// Today
			if (in_array('today', $date)) {

				// If single date, today
				$diff = (int) $currentDateObj->diff($dateStartObj)->format("%r%a");
				if ($diff == 0) {
					array_push($eventsByDate, $event);
				}

				// If range of dates
				if ($event['date_end'] && $diff <= -1) {

					$dateEndObj = new \DateTime($event['date_end']);
					$diffDatesEvent = (int) $dateStartObj->diff($dateEndObj)->format("%r%a");
					if ($diffDatesEvent <= 30) { // We're adding only events that don't last more than 30 days
						array_push($eventsByDate, $event);
					}
				}
			}

			// Tomorrow
			if (in_array('tomorrow', $date)) {

				// If single date, tomorrow
				$diff = (int) $currentDateObj->diff($dateStartObj)->format("%r%a");
				if ($diff == 1) {
					array_push($eventsByDate, $event);
				}

				// If range of dates
				if ($event['date_end']) {

					$dateEndObj = new \DateTime($event['date_end']);
					$diffWithEndDate = (int) $currentDateObj->diff($dateEndObj)->format("%r%a");
					$diffDatesEvent = (int) $dateStartObj->diff($dateEndObj)->format("%r%a");

					if ($diff <= 0 && $diffWithEndDate >= 1 && $diffDatesEvent <= 30) { // We're adding only events that don't last more than 30 days
						array_push($eventsByDate, $event);
					}
				}
			}

			// Next 7 days
			if (in_array('week', $date)) {

				// If single date, tomorrow
				$diff = (int) $currentDateObj->diff($dateStartObj)->format("%r%a");
				if (!$event['date_end'] && $diff <= 7) {
					array_push($eventsByDate, $event);
				}

				// If range of dates
				if ($event['date_end']) {

					$dateEndObj = new \DateTime($event['date_end']);
					$diffWithEndDate = (int) $currentDateObj->diff($dateEndObj)->format("%r%a");
					$diffDatesEvent = (int) $dateStartObj->diff($dateEndObj)->format("%r%a");

					if ($diff < 0 && $diffWithEndDate <= 7 && $diffDatesEvent <= 30) { // We're adding only events that don't last more than 30 days
						array_push($eventsByDate, $event);
					}
				}
			}

		}

		return $eventsByDate;

	}

	// Filter Category
	public function filterEventsByCategory($events, $categories) {

		// Special case, all dates
		if (in_array('all', $categories)) return $events;

		$eventsInCategories = array();
		foreach ($events as $event) {

			$categoriesEvent = explode(',', $event['categories']);
			foreach ($categoriesEvent as $categoryEvent) {
				if (in_array($categoryEvent, $categories)) {
					array_push($eventsInCategories, $event);
					continue 2;
				}
			}

		}

		return $eventsInCategories;
	}

	// Filter Place
	public function filterEventsByPlace($events, $places) {

		// Special case, all dates
		if (in_array('all', $places)) return $events;

		$eventsInPlaces = array();
		foreach ($events as $event) {

			if (in_array($event['place'], $places)) {
				array_push($eventsInPlaces, $event);
			}

		}

		return $eventsInPlaces;
	}

	// Filter Remove Duplicated
	public function filterEventsRemoveDuplicated($events) {

		$eventIds = array();
		$nonDuplicatedEvents = array();
		foreach ($events as $event) {

			if (!in_array($event['id'], $eventIds)) {
				array_push($nonDuplicatedEvents, $event);
				array_push($eventIds, $event['id']);
			}

		}

		return $nonDuplicatedEvents;

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

			$event['date_render'] = RenderFunctions::parseDateForRender($event['date_start'], $event['date_end']);
			$event['hour_render'] = RenderFunctions::parseHourForRender($event['hour']);
			$event['price_render'] = RenderFunctions::parsePriceForRender($event['price']);
			$event['categories_render'] = RenderFunctions::parseCategoriesForRender($event['categories']);

		}

		return $events;

	}


	// SORT EVENTS BY DATE (FOR TWITTER BOT)
	public function sortEventsByDate($events, $dateTarget) {

		if ($dateTarget == 'today') {

			$eventsByDate[0]['date'] = 'hoy';
			$eventsByDate[0]['events'] = $events;

			return $eventsByDate;

		} elseif ($dateTarget == 'tomorrow') {

			$eventsByDate[0]['date'] = 'hoy';
			$eventsByDate[0]['events'] = $events;

			return $eventsByDate;

		}


	}

}