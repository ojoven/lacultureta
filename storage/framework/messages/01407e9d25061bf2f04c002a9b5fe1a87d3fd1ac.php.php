<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Requests;

// Models

class ResumeController extends Controller {

    // SINGLE
    public function single() {

        $params = $_GET;

        $eventModel = new Event();
        $events = $eventModel->getAllEvents();
        $events = $eventModel->sortEvents($events);
        $params = $this->_paramsToArray($params); // little ñapa
        $events = $eventModel->filterEvents($events, $params);
        $events = $eventModel->parseEventsForRender($events);

        $index = ($params['template'][0] == 'first') ? 0 : 1;

        return view('resume/single', array('event' => $events[$index]));
    }

    public function resume() {

        $params = $_GET;

        $eventModel = new Event();
        $events = $eventModel->getAllEvents();
        $events = $eventModel->sortEvents($events);
        $params = $this->_paramsToArray($params); // little ñapa
        $events = $eventModel->filterEvents($events, $params);
        $events = $eventModel->parseEventsForRender($events);
        $events = $eventModel->sortEventsByDate($events, $params['date'][0]);

        return view('resume/resume', array('events' => $events));
    }

    public function _paramsToArray($params) {

        $newParams = array();
        foreach ($params as $index => $paramString) {
            $newParams[$index] = array($paramString);
        }

        return $newParams;
    }

}
