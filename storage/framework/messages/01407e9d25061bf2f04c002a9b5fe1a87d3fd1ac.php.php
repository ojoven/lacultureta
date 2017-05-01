<?php

namespace App\Http\Controllers;

use App\Lib\Functions;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Requests;

// Models

class ResumeController extends Controller {

    // SINGLE
    public function single() {

        $params = $_GET;
        Functions::setLocaleFromLanguage($params['language']);

        $eventModel = new Event();
        $events = $eventModel->getEventsForResume($params);
        $events = $eventModel->parseEventsForRender($events);
        $index = ($params['template'] == 'first') ? 0 : 1;
        if ($events) {
            return view('resume/single', array('event' => $events[$index]));
        } else {
            die('No event');
        }
    }

    public function resume() {

        $params = $_GET;
        Functions::setLocaleFromLanguage($params['language']);

        $eventModel = new Event();
        $events = $eventModel->getEventsForResume($params);
        $events = $eventModel->parseEventsForRender($events);
        $events = $eventModel->sortEventsByDate($events, $params['date']);

        return view('resume/resume', array('events' => $events));
    }

}
