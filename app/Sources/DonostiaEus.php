<?php

use App\Models\Event;
use App\Lib\SimpleHtmlDom;
use App\Lib\DateFunctions;
use App\Lib\Functions;

class DonostiaEus
{

	public function __construct()
	{
		Functions::log('DonostiaEus scraper initialized');
		Functions::log('===============================');
	}

	public function getDataEvents()
	{

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

	public function extractDataEvents($language)
	{

		$events = array();

		// We start with page 1
		$page = 1;
		$numMaxPages = 1;

		// We extract all the events from all pages
		while (true) {

			$url = 'https://www.donostia.eus/ataria/' . $language . '/web/ekintzenagenda/gaur?p_p_id=DTIKEkintzenAgendaController_INSTANCE_YGBcTsHWJF0Z&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_DTIKEkintzenAgendaController_INSTANCE_YGBcTsHWJF0Z_selectedPlace=-1&_DTIKEkintzenAgendaController_INSTANCE_YGBcTsHWJF0Z_goToPage=' . $page . '&_DTIKEkintzenAgendaController_INSTANCE_YGBcTsHWJF0Z_selectedType=-1&_DTIKEkintzenAgendaController_INSTANCE_YGBcTsHWJF0Z_selectedSearch=3';
			$url = 'https://www.donostia.eus/ataria/' . $language . '/web/ekintzenagenda/gaur?p_p_id=DTIKEkintzenAgendaController_INSTANCE_6h4DrYmShvOw&p_p_lifecycle=0&p_p_state=normal&p_p_mode=view&_DTIKEkintzenAgendaController_INSTANCE_6h4DrYmShvOw_selectedPlace=-1&_DTIKEkintzenAgendaController_INSTANCE_6h4DrYmShvOw_goToPage=' . $page . '&_DTIKEkintzenAgendaController_INSTANCE_6h4DrYmShvOw_selectedType=-1&_DTIKEkintzenAgendaController_INSTANCE_6h4DrYmShvOw_selectedSearch=3';
			Functions::log('Get events from page ' . $page . ' for language: ' . $language);
			$htmlContent = Functions::getURLRequest($url);
			$html = SimpleHtmlDom::strGetHtml($htmlContent);

			$resultsAgenda = $html->find('.agendaEventos', 0);
			foreach ($resultsAgenda->find('.defEvento') as $eventDom) {

				$event = array();

				// Event title
				$event['title'] = $eventDom->find('h4', 0)->find('a', 0)->plaintext;

				// Event URL
				$event['url'] = $eventDom->find('h4', 0)->find('a', 0)->href;

				// Event image
				$event['image'] = '';

				// Event place
				$eventPlaceAux = $eventDom->find('.icoDonde', 0);
				$event['place'] = ($eventPlaceAux && $eventPlaceAux->next_sibling()) ? $eventPlaceAux->next_sibling()->plaintext : '';

				// Event date
				$event['date_start'] = $eventDom->find('.eventoFechaInicioDd', 0)->plaintext;
				$eventDateEndAux = $eventDom->find('.eventoFechaFinDd', 0);
				$event['date_end'] = $eventDateEndAux->tag === 'dd' ? $eventDom->find('.eventoFechaFinDd', 0)->plaintext : false; // ERROR

				// Event hour
				$eventHourAux = $eventDom->find('.icoHora', 0);
				$event['hour'] = ($eventHourAux && $eventHourAux->next_sibling()) ? $eventHourAux->next_sibling()->plaintext : '';

				// Event price
				$eventPriceAux = $eventDom->find('.icoPrecio', 0);
				$event['price'] = ($eventPriceAux && $eventPriceAux->next_sibling()) ? $eventPriceAux->next_sibling()->plaintext : '';

				$event = $this->_parseEventDonostiaEUS($event, $language);
				$events[] = $event;
			}

			// We get the events from the next page
			$page++;

			// We'll go to a maximum page
			if ($page > $numMaxPages) {
				break;
			}
		}

		return $events;
	}

	private function _parseEventDonostiaEUS($event, $language)
	{

		// TITLE
		$event['title'] = trim($event['title']);

		// PRICE
		$event['price'] = trim(str_replace(',00', '', str_replace('&#8364;', '€', $event['price'])));
		if (strpos($event['price'], 'Gratis') !== false) $event['price'] = '0 €';

		// PLACE
		$event['place'] = trim($event['place']);

		// HOUR
		$event['hour'] = trim($event['hour']);

		// DATE
		DateFunctions::parseDatesMonth3DigitToMySQLDate($event['date_start'], $event['date_end'], $language);

		// We extract the parameters from the URL
		$kwca = '';

		// EXTERNAL ID
		$event['external_id'] = Functions::getExternalIdFromUrl($event['url']);

		// CATEGORIES
		$event['categories'] = $this->_addCategoriesFromUrlAndTitle($kwca, $event['title']);
		if (empty($event['categories'])) {
			$event['categories'][] = 'Otros';
		}

		$event['categories'] = implode(',', $event['categories']); // TODO: Categories to another table, better.

		// SOURCE
		$event['source'] = 'Donostia.eus';

		// URL
		$event['url'] = str_replace(' ', '%20', str_replace('&amp;', '&', trim($event['url'])));

		// CREATED / UPDATED DATES
		$event['created_at'] = $event['updated_at'] = date('Y-m-d h:i:s');

		return $event;
	}

	public function valid_date($date)
	{
		return (preg_match("/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/", $date));
	}

	private function _addCategoriesFromUrlAndTitle($urlCat, $title)
	{

		$categories = array();
		$haystack = strtolower($title) . ' ' . strtolower($urlCat); // Where we'll be searching for

		// Theatre
		$theatreSlugs = array('teatro', 'danza', 'ballet', 'antzerki', 'dantza');
		if (Functions::strpos_array($haystack, $theatreSlugs) !== false) $categories[] = 'Teatro y Danza';

		// Cinema
		$cinemaSlugs = array('cine', 'película', 'film');
		if (Functions::strpos_array($haystack, $cinemaSlugs) !== false) $categories[] = 'Cine';

		// Music / Concerts
		$musicSlugs = array('concierto', 'kontzertu', 'música', 'musika');
		if (Functions::strpos_array($haystack, $musicSlugs) !== false) $categories[] = 'Música';

		// Sports
		$sportSlugs = array('deporte', 'kirol', 'carrera', 'karrera', 'maratón', 'maratoia');
		if (Functions::strpos_array($haystack, $sportSlugs) !== false) $categories[] = 'Deportes';

		// Expositions
		$expositionSlugs = array('exposicion', 'exposición', 'erakusketa');
		if (Functions::strpos_array($haystack, $expositionSlugs) !== false) $categories[] = 'Exposiciones';

		// Parties
		$partySlugs = array('fiesta', 'feria', 'festa', 'azoka', 'mercadillo');
		if (Functions::strpos_array($haystack, $partySlugs) !== false) $categories[] = 'Fiestas y Ferias';

		// Gastronomy
		$gastronomySlugs = array('gastro', 'pinchos', 'pintxoak');
		if (Functions::strpos_array($haystack, $gastronomySlugs) !== false) $categories[] = 'Gastronomía';

		// Children
		$childrenSlugs = array('infantil', 'haur', 'famili');
		if (Functions::strpos_array($haystack, $childrenSlugs) !== false) $categories[] = 'Actividades Infantiles';

		// Museums
		$museumSlugs = array('museo');
		if (Functions::strpos_array($haystack, $museumSlugs) !== false) $categories[] = 'Museos';

		// Conferences
		$conferenceSlugs = array('conferencia', 'hitzaldi', 'konferentzia');
		if (Functions::strpos_array($haystack, $conferenceSlugs) !== false) $categories[] = 'Conferencias';

		// Literature
		$literatureSlugs = array('literatura', 'lector', 'irakur');
		if (Functions::strpos_array($haystack, $literatureSlugs) !== false) $categories[] = 'Literatura';

		return $categories;
	}

	public function filterNotAddedEvents($events, $language)
	{

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
	public function addAdditionalInformation($events, $language)
	{

		foreach ($events as &$event) {

			Functions::log('Get additional information for ' . $event['title']);

			$htmlContent = Functions::getURLRequest($event['url']);
			$html = SimpleHtmlDom::strGetHtml($htmlContent);
			if (!$html) continue;

			// IMAGE
			$imageDefault = 'https://lacultureta.com/android-icon-192x192.png';
			$imageSuffixDomain = 'https://www.donostia.eus';
			$event['image'] = $html->find('.defEvento', 0)->find('.eventoImagenPortada', 0)->find('img', 0)->src;
			if (!$event['image']) {
				$event['image'] = $imageDefault;
			} else {
				$event['image'] = $imageSuffixDomain . trim($event['image']);
			}

			// DESCRIPTION
			$event['description'] = '';

			// ADDITIONAL INFO
			$event['info'] = $html->find('.defEvento', 0)->find('dl', 0)->outertext;
			$event['info'] = preg_replace('/\s+/', ' ', $event['info']); // Remove extra spaces

			// We add the language too
			$event['language'] = $language;
		}

		return $events;
	}
}
