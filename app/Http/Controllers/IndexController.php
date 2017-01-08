<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Scraper;
use Illuminate\Http\Request;
use App\Http\Requests;

// Models

class IndexController extends Controller {

    public function index() {

        setlocale(LC_ALL, 'es_ES');

        $eventModel = new Event();
        $events = $eventModel->getInitialEvents();

        $data['events'] = $events;
        return view('index', $data);
    }

    public function playground() {

        // Code to play with here


        return view('playground');

    }

    public function scraper() {

        $scraperModel = new Scraper();
        $scraperModel->extractDataEvents();

        return view('playground');
    }

}
