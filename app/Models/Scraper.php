<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use App\Lib\Functions;

class Scraper extends Model {

    public function extractDataEvents() {

        $events = $this->extractDataEventsDonostiaEUS();
        $events = $this->filterNotAddedEvents($events);
        $this->storeEvents($events);

    }

    // Donostia.eus
    public function extractDataEventsDonostiaEUS() {

        $events = array();

        // We start with page 1
        $page = 1;

        // We extract all the events from all pages
        while (true) {

            $url = 'https://www.donostia.eus/info/ciudadano/Agenda.nsf/consultaNoCache?ReadForm=&kpag=' . $page . '&kque=0&kqueNombre=&kzon=0&kzonNombre=&kcua=8&kcuaNombre=De+hoy+en+adelante&kdesde=&kdon=6&idioma=cas';
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

                $event = $this->_parseEventDonostiaEUS($event);
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

    private function _parseEventDonostiaEUS($event) {

        // PRICE
        $event['price'] = trim(str_replace('Precio:', '', str_replace(',00', '', str_replace('&#8364;', '€', $event['price']))));
        if (strpos($event['price'], 'Gratis')!==false) $event['price'] = '0 €';

        // PLACE
        $event['place'] = trim(str_replace('Lugar:', '', $event['place'])); // TODO: This won't work for basque version

        // HOUR
        $event['hour'] = trim(str_replace('Hora:', '', $event['hour']));

        // DATE
        Functions::parseDatesMonth3DigitToMySQLDate($event['date_start'], $event['date_end']);

        // We extract the parameters from the URL
        $kwid = $kwca = '';
        parse_str(str_replace('contenido?ReadForm&', '', str_replace('&amp;', '&', $event['url'])));

        // EXTERNAL ID
        $event['external_id'] = $kwid;

        // CATEGORIES
        if (strpos($kwca, 'Teatro')!==false || strpos(strtolower($event['title']),'exposición')!==false) $event['categories'][] = 'Teatro y Danza';
        if (strpos($kwca, 'Cine')!==false || strpos(strtolower($event['title']),'cine')!==false) $event['categories'][] = 'Cine';
        if (strpos($kwca, 'Conciertos')!==false || strpos(strtolower($event['title']),'concierto')!==false) $event['categories'][] = 'Música';
        if (strpos($kwca, 'eport')!==false || strpos(strtolower($event['title']),'carrera')!==false) $event['categories'][] = 'Deportes';
        if (strpos($kwca, 'Exposiciones')!==false || strpos(strtolower($event['title']),'exposición')!==false) $event['categories'][] = 'Exposiciones';
        if (strpos($kwca, 'Fiestas')!==false || strpos(strtolower($event['title']),'feria')!==false) $event['categories'][] = 'Fiestas y Ferias';
        if (strpos($kwca, 'Gastronom')!==false || strpos(strtolower($event['title']),'gastronom')!==false) $event['categories'][] = 'Gastronomía';
        if (strpos($kwca, 'Infantil')!==false || strpos(strtolower($event['title']),'infantil')!==false) $event['categories'][] = 'Actividades Infantiles';
        if (strpos($kwca, 'Museos')!==false || strpos(strtolower($event['title']),'museo')!==false) $event['categories'][] = 'Museos';

        if (strpos(strtolower($event['title']),'conferencia')!==false) $event['categories'][] = 'Conferencias';
        if (strpos(strtolower($event['title']),'liter')!==false) $event['categories'][] = 'Literatura';

        if (empty($event['categories'])) {
            $event['categories'][] = 'Otros';
        }

        $event['categories'] = implode(',', $event['categories']); // TODO: Categories to another table, better.

        // SOURCE
        $event['source'] = 'Donostia.eus';

        // URL
        $event['url'] = 'https://www.donostia.eus/info/ciudadano/Agenda.nsf/' . str_replace('&amp;', '&', $event['url']);

        // CREATED / UPDATED DATES
        $event['created_at'] = $event['updated_at'] = date('Y-m-d h:i:s');

        return $event;

    }

    private function _setCategory() {

    }

    public function filterNotAddedEvents($events) {

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

    public function storeEvents($events) {

        DB::table('events')->insert($events);

    }

}