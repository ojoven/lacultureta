<?php

use App\Models\Event;
use App\Lib\SimpleHtmlDom;
use App\Lib\DateFunctions;
use App\Lib\Functions;

class Tabakalera {

	public function __construct() {
		Functions::log('Tabakalera scraper initialized');
		Functions::log('===============================');
	}

	public function getDataEvents() {

		$languages = array('es', 'eu');
		$events = array();

		foreach ($languages as $language) {

			// We get the events
			$eventsLanguage = $this->extractDataEvents($language);
			//$eventsLanguage = $this->filterNotAddedEvents($eventsLanguage, $language);
			$eventsLanguage = $this->addAdditionalInformation($eventsLanguage, $language);

			$events = array_merge($events, $eventsLanguage);
		}

		return $events;
	}

	private function _getLastPageAgenda($resultsAgenda) {

		return 0;
	}

	public function extractDataEvents($language) {

		$urlBaseEventTabakalera = 'https://www.tabakalera.eu/';
		$events = array();

		// We start with page 0
		$page = 0;

		// We extract all the events from all pages
		while (true) {

			$urlLangs['es'] = 'https://www.tabakalera.eu/es/agenda-cultural-san-sebastian/mensual?page=' . $page;
			$urlLangs['eu'] = 'https://www.tabakalera.eu/eu/agenda-kulturala-donostia/hilabetea?page=' . $page;
			$url = $urlLangs[$language];

			Functions::log('Get events from page ' . ($page + 1) . ' for language: ' . $language);

			$html = SimpleHtmlDom::file_get_html($url);
			$resultsAgenda = $html->find('.listado-agenda', 0);

			$lastPage = $this->_getLastPageAgenda($resultsAgenda);

			foreach ($resultsAgenda->find('.views-row') as $eventDom) {

				$event = array();

				// Event title
				$event['title'] = $eventDom->find('h4', 0)->find('a', 0)->plaintext;

				// Event URL (and Event ID, we'll define it by its URL)
				$eventUrl = $eventDom->find('h4', 0)->find('a', 0)->href;
				$event['external_id'] = $eventUrl;
				$event['url'] = $urlBaseEventTabakalera . $eventUrl;

				// Event image
				$event['image'] = $eventDom->find('.bloque-agenda--img', 0)->find('img', 0)->src;

				// Event place
				$event['place'] = 'Tabakalera';

				// Event date
				$date = $eventDom->find('.bloque-agenda-datos', 0)->find('.fecha', 0)->plaintext;
				$event['date_start'] = 'placeholder';
				$event['date_end'] = 'placeholder';

				// Event hour
				$event['hour'] = $eventDom->find('.bloque-agenda-datos', 0)->find('span', 1)->plaintext;

				Functions::log($event);
				$events[] = $event;
			}

			// If no more pages
			if ($page === $lastPage) {
				break;
			}

			// We get the events from the next page
			$page++;
		}

		return $events;

	}

	private function _parseEventTabakalera($event, $language) {

		// PRICE
		if (strpos($event['price'], __('gratis'))!==false) $event['price'] = '0 €';

		// DATE
		DateFunctions::parseDatesMonth3DigitToMySQLDate($event['date_start'], $event['date_end'], $language);

		// CATEGORIES
		$event['categories'] = $this->parseCategoryEventTabakalera($event['categories']);

		// SOURCE
		$event['source'] = 'Tabakalera.eu';

		// URL
		$event['url'] = 'https://www.tabakalera.eu/' . $event['url'];

		// CREATED / UPDATED DATES
		$event['created_at'] = $event['updated_at'] = date('Y-m-d h:i:s');

		return $event;

	}

	public function parseCategoryEventTabakalera($category) {

		$arrayParses = array(
			'Exposición' => 'Exposiciones',
			'Conferencia' => 'Conferencias',
			'Presentación' => 'Conferencias',
			'Seminario' => 'Conferencias',
			'Encuentro' => 'Talleres y Encuentros',
			'Taller' => 'Talleres y Encuentros',
			'Coloquio' => 'Talleres y Encuentros',
			'Concierto' => 'Música',
			'Cine' => 'Cine',
		);

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

			// IMAGE
			// Though we already have an image it's a thumbnail, we'll get here the full size image
			$image = $html->find('.bloque-img', 0)->find('img', 0)->src;
			if ($image) {
				$event['image'] = $image;
			}

			// ADDITIONAL INFO
			$event['info'] = '';
			foreach ($html->find('.seccion-media--media', 0)->children() as $index => $paragraph) {
				if ($index == 0) continue; // The first child is the image
				$event['info'] .= $paragraph->outertext;
			}

			// PLACE (ADDITIONAL)
			$event['place_additional'] = $this->getValueFromIndexFromTabakaleraSinglePageBasicData($html, __('lugar'));

			// PRICE
			$event['price'] = $this->getValueFromIndexFromTabakaleraSinglePageBasicData($html, __('precio'));

			$event['date'] = $this->getValueFromIndexFromTabakaleraSinglePageBasicData($html, __('fecha'));
			$event['hour'] = $this->getValueFromIndexFromTabakaleraSinglePageBasicData($html, __('horario'));
			$event['language_event'] = $this->getValueFromIndexFromTabakaleraSinglePageBasicData($html, __('idioma'));
			$event['access'] = $this->getValueFromIndexFromTabakaleraSinglePageBasicData($html, __('acceso'));
			$event['ages'] = $this->getValueFromIndexFromTabakaleraSinglePageBasicData($html, __('público'));

			// LANGUAGE
			$event['language'] = $language;

			Functions::log($event);
			$event = $this->_parseEventTabakalera($event, $language);

		}

		return $events;

	}

	public function getValueFromIndexFromTabakaleraSinglePageBasicData($html, $index) {

		$index = ucfirst($index) . ':'; // from "lugar" to "Lugar:"

		foreach ($html->find('.datos-basicos-items', 0)->find('li') as $li) {

			$liText = $li->plaintext;
			Functions::log($liText);

			if (strpos($liText, $index) !== false) {
				$liValue = $li->find('span', 0)->plaintext;
				return $liValue;
			}

		}

		return null;

	}

}

