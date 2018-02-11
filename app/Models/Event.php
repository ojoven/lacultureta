<?php

namespace App\Models;
use App\Lib\DateFunctions;
use App\Lib\Functions;
use App\Lib\CacheFunctions;
use App\Lib\RenderFunctions;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class Event extends Model {

	protected $numEventsPage = 10;

	// All Events
	public function getAllEvents() {

		$events = self::get()->toArray();
		return $events;
	}

	// Get Events by Filter
	public function getEvents($params) {

		return Cache::remember(CacheFunctions::getCacheKeyParams($params), 60, function() use ($params) {

			$page = $params['page'];
			$offset = ($page - 1) * $this->numEventsPage;

			$events = $this->getAllFutureEvents();
			$events = $this->filterEvents($events, $params);
			$events = $this->sortEvents($events);
			$events = array_slice($events, $offset, $this->numEventsPage);
			$events = $this->parseEventsForRender($events);
			return $events;
		});

	}

	// Get all future events
	public function getAllFutureEvents() {

		$language = Functions::getUserLanguage();

		$today = date('Y-m-d');
		$events = self::where(function($query) use ($today) {
			$query->whereDate('date_start', '>=', $today)->orWhereDate('date_end', '>=', $today);
		})->where(function($query) use ($language) {
			$query->where('language', '=', $language)->orWhereNull('language');
		})->orderBy('date_start', 'asc')->get()->toArray();
		return $events;
	}

	// GET RESUME EVENTS
	public function getEventsForResume($params) {

		$events = $this->getAllFutureEvents();
		$events = $this->sortEvents($events);
		$params = Functions::parseStringParamsToArray($params); // little ñapa
		$events = $this->filterEvents($events, $params);

		return $events;
	}

	// FILTERS
	public function filterEvents($events, $params) {

		$events = $this->filterEventsByDate($events, $params['date']);
		$events = $this->filterEventsByCategory($events, $params['category']);
		$events = $this->filterEventsByPlace($events, $params['place']);
		$events = (isset($params['language'])) ? $this->filterEventsByLanguage($events, $params['language']) : $events;

		$events = $this->filterEventsRemoveDuplicated($events);

		return $events;
	}


	public function filterEventsByDate($events, $date) {

		// Special case, all dates
		if (in_array('all', $date)) {
			return $events;
		}


		$eventsByDate = array();

		foreach ($events as $event) {

			$dateStartObj = new \DateTime($event['date_start']);

			// Today
			foreach ($date as $day) {

				$dayObj = new \DateTime($day);

				// If single date, today
				$diff = (int) $dayObj->diff($dateStartObj)->format("%r%a");
				if ($diff == 0) {
					array_push($eventsByDate, $event);
				}

			}

			// If range of dates
			/**
			if ($event['date_end'] && $diff <= -1) {

				$dateEndObj = new \DateTime($event['date_end']);
				$diffDatesEvent = (int) $dateStartObj->diff($dateEndObj)->format("%r%a");
				if ($diffDatesEvent <= 30) { // We're adding only events that don't last more than 30 days
					array_push($eventsByDate, $event);
				}
			}
			**/
		}

		return $eventsByDate;

	}

	// Filter Category
	public function filterEventsByCategory($events, $categories) {

		// Special case, all dates
		if (in_array('all', $categories)) {
			return $events;
		}

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
		if (in_array('all', $places)) {
			return $events;
		}

		$eventsInPlaces = array();
		foreach ($events as $event) {

			if (in_array($event['place'], $places)) {
				array_push($eventsInPlaces, $event);
			}

		}

		return $eventsInPlaces;
	}

	// Filter language
	public function filterEventsByLanguage($events, $language) {

		$eventsLanguage = array();
		foreach ($events as $event) {

			if (in_array($event['language'], $language) || $event['language'] == '') {
				array_push($eventsLanguage, $event);
			}

		}

		return $eventsLanguage;

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

		$ratingModel = new Rating();

		foreach ($events as &$event) {

			$event['type'] = 'event';
			$event['date_render'] = RenderFunctions::parseDateForRender($event['date_start'], $event['date_end']);
			$event['hour_render'] = RenderFunctions::parseHourForRender($event['hour']);
			$event['price_render'] = RenderFunctions::parsePriceForRender($event['price']);
			$event['categories_render'] = RenderFunctions::parseCategoriesForRender($event['categories']);
			$event['likes'] = $ratingModel->getLikesEvent($event);
		}

		return $events;

	}


	// SORT EVENTS BY DATE (FOR TWITTER BOT)
	public function sortEventsByDate($events, $dateTarget) {

		$today = date('Y-m-d');
		$tomorrow = date("Y-m-d", strtotime('tomorrow'));
		$after7days = date('Y-m-d', strtotime('+7 day'));

		if ($dateTarget == 'today') {
			$dates = array($today);
		} elseif ($dateTarget == 'tomorrow') {
			$dates = array($tomorrow);
		} elseif ($dateTarget == 'week') {
			$dates = DateFunctions::dateRange($today, $after7days);
		} elseif ($dateTarget == 'weekend') {

			$thisFriday = DateFunctions::getThisWeekDayDate('friday');
			$thisSunday = DateFunctions::getThisWeekDayDate('sunday');

			$dates = DateFunctions::dateRange($thisFriday, $thisSunday);
		}

		foreach ($dates as $index => $date) {
			$eventsByDate[$index]['date'] = $date;
			foreach ($events as $event) {
				if (DateFunctions::doesEventHappenInDate($event, $date)) {
					$eventsByDate[$index]['events'][] = $event;
				}
			}
		}

		$eventsByDate = $this->externalizeEventsRangeBiggerThan2Days($eventsByDate);
		return $eventsByDate;
	}

	public function externalizeEventsRangeBiggerThan2Days($eventsByDate) {

		$parsedEventsByDate['single'] = array();
		$parsedEventsByDate['range'] = array();

		foreach ($eventsByDate as $index => $date) {

			$parsedEventsByDate['single'][$index]['date'] = $date['date'];
			$parsedEventsByDate['single'][$index]['events'] = array();

			if (isset($date['events'])) {

				foreach ($date['events'] as $event) {

					// Single Events
					if (!$event['date_end']
						// Or just 2 days long range events
						|| DateFunctions::getNumOfDaysFromDate1ToDate2($event['date_start'], $event['date_end']) <= 2) {
						$parsedEventsByDate['single'][$index]['events'][] = $event;
					} else {
						$parsedEventsByDate['range'][] = $event;
					}

				}
			}

		}

		return $parsedEventsByDate;
	}

	/** GET EVENTS USER **/
	public function getEventsUser($params) {

		$ratingModel = new Rating();
		$ratings = $ratingModel->getRatings($params, $params['like_dislike']);
		$events = $this->getEventsFromRatings($ratings);
		$events = $this->sortEvents($events);
		$events = $this->parseEventsForRender($events);
		return $events;

	}

	// EVENTS FROM RATINGS
	public function getEventsFromRatings($ratings) {

		$eventIds = Functions::getArrayWithIndexValues($ratings, 'eventId');
		if (!$eventIds) {
			return array();
		}
		$ids_ordered = implode(',', $eventIds);
		$events = self::whereIn('id', $eventIds)->orderByRaw(DB::raw("FIELD(id, $ids_ordered)"))->get()->toArray();
		return $events;
	}

	/** EVENTS BY IDs **/
	public function getEventsByIds($eventIds) {

		$events = self::whereIn('id', $eventIds)->get()->toArray();
		$events = $this->sortEvents($events);
		$events = $this->parseEventsForRender($events);
		return $events;
	}

	/** GET TRANSLATED EVENT **/
	// Given an event, it returns the same event in the translated language (es -> eu, eu -> es)
	public function getTranslatedEvent($event) {

		$toLanguage = ($event['language'] === 'es') ? 'eu' : 'es';
		return self::where('external_id', '=', $event['external_id'])->where('language', '=', $toLanguage)->first();

	}

}
