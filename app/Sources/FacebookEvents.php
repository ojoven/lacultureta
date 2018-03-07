<?php

use App\Models\Event;
use App\Lib\SimpleHtmlDom;
use App\Lib\DateFunctions;
use App\Lib\Functions;

require_once __DIR__ . '/../Lib/php-graph-sdk/src/Facebook/autoload.php'; // change path as needed

class FacebookEvents {

	protected $fb;

	public function __construct() {
		Functions::log('FacebookEvents scraper initialized');
		Functions::log('===============================');

		// Initialize FB
		$this->fb = new \Facebook\Facebook([
			'app_id' => config('facebook.appId'),
			'app_secret' => config('facebook.appSecret'),
			'default_graph_version' => 'v2.10',
			'default_access_token' => config('facebook.accessToken'), // optional
		]);

	}

	public function getDataEvents() {

		$pageIds = array(
			'Keler18',
			'conventgardenSS',
			'donostiakultura',
			'impacthubdonostia',
			'sansebastianshops',
			'1542110596066274', // Alboka
			'xaviertxo', // Bar El Muro
			'313745512341980', // Bar Altxerri
			'dabadabaSS',
			'ReReadDonositaGros',
			'ginmusica',
			'gusansebastian',
			'JuguemosElk',
			'euskalbillera',
			'node.eus',
			'koralakeae',
			'haritzalde',
			'ulialdeelkartea',
			'GipuzkoaSurf',
			'kresalaelkartea',
			'BATAPLANDISCOOFFICIAL',
			'LaCarpaOndarretaSanSebastian',
			'103919206620911', // Erdialde Elkartea
			'sistersandthecity',
			'grossbeer',
			'donostilindyhop',
			'kontadores.gazte.zentroa',
			'tienda.katamotz',
			'yogashaladonostia',
			'jesuitinasdonostia',
			'AtuBolaDonosti',
			'ancorasansebastian',
			'KidsandUsDonostia',
			'chopperbar.donostia',
			'1422786554612078', // Bar Izarraitz
			'donostialagunkoia',
			'lasalledonostia.ikastetxea',
			'cotebardonostia',
			'geronimoshops',
			'BasquelandBrewingProject',
			'ElevaYogaDonostia',
			'SanSebastianGastronomika',
			'rctss',
			'enclaveestudio',
			'milksansebastian',
			'Aquarium.Donostia.SanSebastian',
			'amaraplaza.sansebastian',
			'lamadamesansebastian',
			'OIenDonostia',
			'komplot',
			'mollymalonesansebastian',
			'ClubAtleticoSS',
			'coartdonostia',
			'tandemsansebastian',
			'dss2016',
			'pucdonostia',
			'peopledisco',
			'BehobiaSS',
			'ESCUELADEMASAJESANSEBASTIAN',
			'GalernaStudio',
			'SantaBarBaraTaberna',
			'pubbasque',
			'latabernadeaitor',
			'vintageclosetss',
			'228536630535007', // Decathlon
			'152714321436277', // Diocesis SS

		);

		//$pageIds = array('dabadabaSS');

		$events = array();

		foreach ($pageIds as $pageId) {

			// We get the events
			$eventsFacebookPage = $this->extractDataEvents($pageId);
			$eventsFacebookPage = $this->filterNotAddedEvents($eventsFacebookPage);

			$events = array_merge($events, $eventsFacebookPage);
		}

		return $events;

	}

	public function extractDataEvents($pageId) {

		Functions::log('Get events from page ' . $pageId);

		$events = $eventsFb = array();
		$endpoint = $pageId . '/events?time_filter=upcoming&fields=cover,start_time,end_time,name,description,id,category,place';
		$response = $this->fb->get($endpoint);
		if ($response->getHttpStatusCode() === 200) {
			$body = $response->getDecodedBody();
			$eventsFb = $body['data'];
		}

		foreach ($eventsFb as $eventFb) {

			$event = array();

			// Event ID
			$event['external_id'] = $eventFb['id'];

			// Event title
			$event['title'] = $eventFb['name'];

			// Event Info / Description
			$event['info'] = '';
			$event['description'] = (isset($eventFb['description'])) ? Functions::remove3and4bytesCharFromUtf8Str($eventFb['description']) : '';

			// Event URL
			$event['url'] = 'https://www.facebook.com/events/' . $eventFb['id'] . '/';

			// Event image
			$event['image'] = isset($eventFb['cover']['source']) ? $eventFb['cover']['source'] : false;

			// Event place
			$event['place'] = isset($eventFb['place']['name']) ? $eventFb['place']['name'] : '';

			// Event date & Hour
			date_default_timezone_set('Europe/Madrid');
			$startTime = strtotime($eventFb['start_time']);
			$event['date_start'] = date('Y-m-d', $startTime);
			$event['date_end'] = null;

			if (isset($eventFb['end_time'])) {
				$endTime = strtotime($eventFb['end_time']);
				$event['date_end'] = date('Y-m-d', $endTime);

				// If the event finishes the same day
				if ($event['date_start'] == $event['date_end']) $event['date_end'] = null;

				// If the event finishes the next day (after midnight, before 8 in the morning)
				$hourEnd = date('G', $endTime);
				$maxMidnightHour = 8;
				$startNextDay = date('Y-m-d', strtotime($event['date_start'] . ' +1 day'));
				if ($event['date_end'] === $startNextDay && (int)$hourEnd < $maxMidnightHour) $event['date_end'] = null;
			}

			// Event hour
			$event['hour'] = date('H:i', $startTime);

			// Event price
			$event['price'] = null;

			// CATEGORIES
			$event['categories'] = $this->_addCategoriesFromTitle($event['title']);
			if (empty($event['categories'])) {
				$event['categories'][] = 'Otros';
			}

			$event['categories'] = implode(',', $event['categories']);

			// SOURCE
			$event['source'] = 'Facebook';

			// CREATED / UPDATED DATES
			$event['created_at'] = $event['updated_at'] = date('Y-m-d h:i:s');

			$events[] = $event;
		}

		return $events;

	}

	private function _addCategoriesFromTitle($title) {

		$categories = array();
		$haystack = strtolower($title);

		// Theatre
		$theatreSlugs = array('teatro', 'danza', 'ballet', 'antzerki', 'dantza');
		if (Functions::strpos_array($haystack, $theatreSlugs)!==false) $categories[] = 'Teatro y Danza';

		// Cinema
		$cinemaSlugs = array('cine', 'película', 'film');
		if (Functions::strpos_array($haystack, $cinemaSlugs)!==false) $categories[] = 'Cine';

		// Music / Concerts
		$musicSlugs = array('concierto', 'kontzertu','música', 'musika');
		if (Functions::strpos_array($haystack, $musicSlugs)!==false) $categories[] = 'Música';

		// Sports
		$sportSlugs = array('deporte', 'kirol', 'carrera', 'karrera', 'maratón', 'maratoia');
		if (Functions::strpos_array($haystack, $sportSlugs)!==false) $categories[] = 'Deportes';

		// Expositions
		$expositionSlugs = array('exposicion', 'exposición', 'erakusketa');
		if (Functions::strpos_array($haystack, $expositionSlugs)!==false) $categories[] = 'Exposiciones';

		// Parties
		$partySlugs = array('fiesta', 'feria', 'festa', 'azoka', 'mercadillo');
		if (Functions::strpos_array($haystack, $partySlugs)!==false) $categories[] = 'Fiestas y Ferias';

		// Gastronomy
		$gastronomySlugs = array('gastro', 'pinchos', 'pintxoak');
		if (Functions::strpos_array($haystack, $gastronomySlugs)!==false) $categories[] = 'Gastronomía';

		// Children
		$childrenSlugs = array('infantil', 'haur', 'famili');
		if (Functions::strpos_array($haystack, $childrenSlugs)!==false) $categories[] = 'Actividades Infantiles';

		// Museums
		$museumSlugs = array('museo');
		if (Functions::strpos_array($haystack, $museumSlugs)!==false) $categories[] = 'Museos';

		// Conferences
		$conferenceSlugs = array('conferencia', 'hitzaldi', 'konferentzia');
		if (Functions::strpos_array($haystack, $conferenceSlugs)!==false) $categories[] = 'Conferencias';

		// Literature
		$literatureSlugs = array('literatura', 'lector', 'irakur');
		if (Functions::strpos_array($haystack, $literatureSlugs)!==false) $categories[] = 'Literatura';

		return $categories;
	}

	public function filterNotAddedEvents($events) {

		Functions::log('Filter events');

		// We get all the events' external IDs
		$eventExternalIds = Functions::getArrayWithIndexValues($events, 'external_id');

		// Now we retrieve from the DB all the events stored with those external IDs)
		$eventModel = new Event();
		$previousEvents = $eventModel->whereIn('external_id', $eventExternalIds)->get()->toArray();
		$previousEventsIds = Functions::getArrayWithIndexValues($previousEvents, 'external_id');

		$notDuplicatedEvents = array();
		foreach ($events as $event) {
			if (!in_array($event['external_id'], $previousEventsIds)) {
				$notDuplicatedEvents[] = $event;
			}
		}

		return $notDuplicatedEvents;

	}

	// RETRIEVE IMAGE FROM SINGLE EVENT
	public function addAdditionalInformation($events) {

		foreach ($events as &$event) {

			Functions::log('Get image for ' . $event['title']);
			$endpoint = $event['external_id'] . '/picture?type=large';
			$response = $this->fb->get($endpoint);
			if ($response->getHttpStatusCode() === 200) {
				$body = $response->getDecodedBody();
				$event['image'] = $body['data']['url'];
			}

		}

		return $events;

	}

}