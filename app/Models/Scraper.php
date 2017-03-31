<?php

namespace App\Models;
use App\Lib\DateFunctions;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use App\Lib\Functions;

class Scraper extends Model {

    public function extractDataEvents() {

        $languages = array('es', 'eu');

        foreach ($languages as $language) {

            // We get the events
            $events = $this->extractDataEventsDonostiaEUS($language);
            $events = $this->filterNotAddedEvents($events, $language);
            $events = $this->addAdditionalInformation($events, $language);
            $this->storeEvents($events);
        }

    }

    // Donostia.eus
    public function extractDataEventsDonostiaEUS($language) {

        $events = array();

        // We start with page 1
        $page = 1;

        // We extract all the events from all pages
        while (true) {

            $suffixLang = ($language == 'es') ? 'cas' : 'eus';
            $url = 'https://www.donostia.eus/info/ciudadano/Agenda.nsf/consultaNoCache?ReadForm=&kpag=' . $page . '&kque=0&kqueNombre=&kzon=0&kzonNombre=&kcua=8&kcuaNombre=De+hoy+en+adelante&kdesde=&kdon=6&idioma=' . $suffixLang;
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
        $title = strtolower($title);

        if (strpos($urlCat, 'Teatro')!==false
            || strpos($title, 'teatro')!==false
            || strpos($title, 'danza')!==false
            || strpos($title, 'ballet')!==false) $categories[] = 'Teatro y Danza';
        if (strpos($urlCat, 'Cine')!==false
            || strpos($title, 'cine')!==false
            || strpos($title, 'película')!==false) $categories[] = 'Cine';
        if (strpos($urlCat, 'Conciertos')!==false
            || strpos($title, 'concierto')!==false
            || strpos($title, 'música')!==false) $categories[] = 'Música';
        if (strpos($urlCat, 'eport')!==false
            || strpos($title, 'carrera')!==false
            || strpos($title, 'deporte')!==false) $categories[] = 'Deportes';
        if (strpos($urlCat, 'Exposiciones')!==false
            || strpos($title, 'exposición')!==false) $categories[] = 'Exposiciones';
        if (strpos($urlCat, 'Fiestas')!==false
            || strpos($title, 'feria')!==false
            || strpos($title, 'feria')!==false) $categories[] = 'Fiestas y Ferias';
        if (strpos($urlCat, 'Gastronom')!==false
            || strpos($title, 'gastro')!==false) $categories[] = 'Gastronomía';
        if (strpos($urlCat, 'Infantil')!==false
            || strpos($title, 'infantil')!==false) $categories[] = 'Actividades Infantiles';
        if (strpos($urlCat, 'Museos')!==false
            || strpos($title, 'museo')!==false) $categories[] = 'Museos';

        if (strpos($title, 'conferencia')!==false) $categories[] = 'Conferencias';
        if (strpos($title, 'liter')!==false) $categories[] = 'Literatura';

        return $categories;
    }

    public function filterNotAddedEvents($events, $language) {

        // We get all the events' external IDs
        $eventExternalIds = Functions::getArrayWithIndexValues($events, 'external_id');

        // Now we retrieve from the DB all the events stored with those external IDs
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

    // RETRIEVE INFO FROM SINGLE PAGE
    public function addAdditionalInformation($events, $language) {

        foreach ($events as &$event) {

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

    public function storeEvents($events) {

        DB::table('events')->insert($events);

    }

}