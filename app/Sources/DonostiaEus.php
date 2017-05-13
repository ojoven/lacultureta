<?php

use App\Models\Event;
use App\Lib\SimpleHtmlDom;
use App\Lib\DateFunctions;
use App\Lib\Functions;

class DonostiaEus {

	public function __construct() {
		Functions::log('DonostiaEus scraper initialized');
		Functions::log('===============================');
	}

	public function getDataEvents() {

		$languages = array('es', 'eu');
		$events = array();

		foreach ($languages as $language) {

			// We get the events
			$eventsLanguage = $this->extractDataEvents($language);
			$eventsLanguage = $this->filterNotAddedEvents($eventsLanguage, $language);
			$eventsLanguage = $this->addAdditionalInformation($eventsLanguage, $language);

			$events = array_merge($events, $eventsLanguage);
		}

		return $events;

	}

	public function extractDataEvents($language) {

		$events = array();

		// We start with page 1
		$page = 1;

		// We extract all the events from all pages
		while (true) {

			$suffixLang = ($language == 'es') ? 'cas' : 'eus';
			$url = 'https://www.donostia.eus/info/ciudadano/Agenda.nsf/consultaNoCache?ReadForm=&kpag=' . $page . '&kque=0&kqueNombre=&kzon=0&kzonNombre=&kcua=8&kcuaNombre=De+hoy+en+adelante&kdesde=&kdon=6&idioma=' . $suffixLang;
			Functions::log('Get events from page ' . $page . ' for language: ' . $language);
			$html = SimpleHtmlDom::file_get_html($url);

			$resultsAgenda = $html->find('.resultados-agenda', 0);
			foreach ($resultsAgenda->find('.media') as $eventDom) {

				$event = array();

				// Event title
				$event['title'] = $eventDom->find('.media-heading', 0)->find('a', 0)->plaintext;

				// Event URL
				$event['url'] = $eventDom->find('.media-heading', 0)->find('a', 0)->href;

				// Event image
				$event['image'] = $eventDom->find('.media-object', 0)->find('img', 0)->src;

				// Event place
				$event['place'] = $eventDom->find('.media-body', 0)->find('span', 0)->plaintext;

				// Event date
				$event['date_start'] = $eventDom->find('.fechas', 0)->find('p', 0)->plaintext;
				$event['date_end'] = ($eventDom->find('.fechas', 0)->find('p', 1)) ? $eventDom->find('.fechas', 0)->find('p', 1)->plaintext : false;

				// Event hour
				$event['hour'] = $eventDom->find('.media-body', 0)->find('span', 1)->plaintext;

				// Event price
				$event['price'] = $eventDom->find('.media-body', 0)->find('span', 2)->plaintext;

				$event = $this->_parseEventDonostiaEUS($event, $language);
				$events[] = $event;
			}

			// We get the events from the next page
			$page++;

			// If no more pages
			$nextPage = $html->find('.pagination', 0)->find('li', -1);
			if (isset($nextPage->class) && $nextPage->class = "disabled") {
				break;
			}

		}

		return $events;

	}

	private function _parseEventDonostiaEUS($event, $language) {

		// PRICE
		$event['price'] = trim(str_replace('Prezioa:', '', str_replace('Precio:', '', str_replace(',00', '', str_replace('&#8364;', '€', $event['price'])))));
		if (strpos($event['price'], 'Gratis')!==false) $event['price'] = '0 €';

		// PLACE
		$event['place'] = trim(str_replace('Lekua:', '', str_replace('Lugar:', '', $event['place'])));

		// HOUR
		$event['hour'] = trim(str_replace('Ordua:', '', str_replace('Hora:', '', $event['hour'])));

		// DATE
		DateFunctions::parseDatesMonth3DigitToMySQLDate($event['date_start'], $event['date_end'], $language);

		// We extract the parameters from the URL
		$kwid = $kwca = '';
		parse_str(str_replace('contenido?ReadForm&', '', str_replace('&amp;', '&', $event['url'])));

		// EXTERNAL ID
		$event['external_id'] = $kwid;

		// CATEGORIES
		$event['categories'] = $this->_addCategoriesFromUrlAndTitle($kwca, $event['title']);
		if (empty($event['categories'])) {
			$event['categories'][] = 'Otros';
		}

		$event['categories'] = implode(',', $event['categories']); // TODO: Categories to another table, better.

		// SOURCE
		$event['source'] = 'Donostia.eus';

		// URL
		$event['url'] = 'https://www.donostia.eus/info/ciudadano/Agenda.nsf/' . str_replace(' ', '%20', str_replace('&amp;', '&', $event['url']));

		// CREATED / UPDATED DATES
		$event['created_at'] = $event['updated_at'] = date('Y-m-d h:i:s');

		return $event;

	}

	public function valid_date($date) {
		return (preg_match("/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/", $date));
	}

	private function _addCategoriesFromUrlAndTitle($urlCat, $title) {

		$categories = array();
		$haystack = strtolower($title) . ' ' . strtolower($urlCat); // Where we'll be searching for

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

	public function filterNotAddedEvents($events, $language) {

		Functions::log('Filter events');

		// We get all the events' external IDs
		$eventExternalIds = Functions::getArrayWithIndexValues($events, 'external_id');

		// Now we retrieve from the DB all the events stored with those external IDs (for that language)
		$eventModel = new Event();
		$previousEvents = $eventModel->whereIn('external_id', $eventExternalIds)->where('language', '=', $language)->get()->toArray();
		$previousEventsIds = Functions::getArrayWithIndexValues($previousEvents, 'external_id');

		$notDuplicatedEvents = array();
		foreach ($events as $event) {
			if (!in_array($event['external_id'], $previousEventsIds)) {
				$notDuplicatedEvents[] = $event;
			}
		}

		return $notDuplicatedEvents;

	}

	// RETRIEVE INFO FROM SINGLE PAGE
	public function addAdditionalInformation($events, $language) {

		foreach ($events as &$event) {

			Functions::log('Get additional information for ' . $event['title']);

			$htmlContent = file_get_contents($event['url']);
			$html = SimpleHtmlDom::str_get_html($htmlContent);
			if (!$html) continue;

			// DESCRIPTION
			$event['description'] = $html->find('.cabecera-ficha', 0)->find('p', 0)->plaintext;

			// ADDITIONAL INFO
			$event['info'] = '';
			foreach ($html->find('.cabecera-ficha', 0)->next_sibling()->children() as $paragraph) {
				$event['info'] .= $paragraph->outertext;
			}

			$event['info'] = preg_replace('/\s+/', ' ', $event['info']); // Remove extra spaces

			// We add the language too
			$event['language'] = $language;

		}

		return $events;

	}

}