<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use App\Models\SimpleHtmlDom;

class Scraper extends Model {

    public function extractDataEvents() {

        $events = $this->extractDataEventsDonostiaEUS();
        $this->storeNonDuplicatedEvents($events);

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

                // Event title
                $event['title'] = $eventDom->find('.media-heading', 0)->find('a', 0)->plaintext;

                // Event URL
                $event['url'] = $eventDom->find('.media-heading', 0)->find('a', 0)->href;

                // Event image
                $event['image'] = $eventDom->find('.media-object', 0)->find('img', 0)->src;

                // Event place
                $event['place'] = $eventDom->find('.media-body', 0)->find('span', 0)->plaintext;

                // Event date
                $event['date']['begin'] = $eventDom->find('.fechas', 0)->find('p', 0)->plaintext;
                $event['date']['end'] = ($eventDom->find('.fechas', 0)->find('p', 1)) ? $eventDom->find('.fechas', 0)->find('p', 1)->plaintext : false;

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
            if (1) break;

        }

        return $events;

    }

    private function _parseEventDonostiaEUS($event) {

        // PRICE
        $event['price'] = trim(str_replace('Precio:', '', str_replace('€', '', str_replace(',00', '', str_replace('&#8364;', '', $event['price'])))));
        if (strpos($event['price'], 'Gratis')!==false) $event['price'] = '0';

        // PLACE
        $event['place'] = trim(str_replace('Lugar:', '', $event['place'])); // TODO: This won't work for basque version

        // HOUR
        $event['hour'] = trim(str_replace('Hora:', '', $event['hour']));

        // DATE


        // We extract the parameters from the URL
        $kwid = $kwca = '';
        parse_str(str_replace('contenido?ReadForm&', '', str_replace('&amp;', '&', $event['url'])));

        // EXTERNAL ID
        $event['external_id'] = $kwid;

        // CATEGORIES
        if (strpos($kwca, 'Teatro')!==false) $event['categories'][] = 'Teatro y Danza';
        if (strpos($kwca, 'Cine')!==false) $event['categories'][] = 'Cine';
        if (strpos($kwca, 'Conciertos')!==false) $event['categories'][] = 'Música';
        if (strpos($kwca, 'eport')!==false) $event['categories'][] = 'Deportes';
        if (strpos($kwca, 'Exposiciones')!==false) $event['categories'][] = 'Exposiciones';
        if (strpos($kwca, 'Fiestas')!==false) $event['categories'][] = 'Fiestas y Ferias';
        if (strpos($kwca, 'Gastronom')!==false) $event['categories'][] = 'Gastronomía';
        if (strpos($kwca, 'Infantil')!==false) $event['categories'][] = 'Actividades Infantiles';
        if (strpos($kwca, 'Museos')!==false) $event['categories'][] = 'Museos';

        if (empty($event['categories'])) {
            $event['categories'][] = 'Otros';
        }

        return $event;

    }

    public function storeNonDuplicatedEvents($events) {

    }

}