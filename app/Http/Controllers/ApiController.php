<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Scraper;
use Illuminate\Http\Request;
use App\Http\Requests;

// Models

class ApiController extends Controller {

    public function getcards() {

        $params = $_GET;

        $eventModel = new Event();
        $events = $eventModel->getEvents($params);

        return view('cards', array('events' => $events));

    }

}
