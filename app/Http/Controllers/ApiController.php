<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Requests;

// Models

class ApiController extends Controller {

    /** GET CARDS **/
    public function getcards() {

        $params = $_GET;

        $eventModel = new Event();
        $events = $eventModel->getEvents($params);

        return view('cards', array('events' => $events));
    }

    /** GET CARDS **/
    public function getcardsuser() {

        $params = $_GET;

        $eventModel = new Event();
        $events = $eventModel->getEventsUser($params);

        return view('cards', array('events' => $events));
    }

    /** CREATE USER **/
    public function createuser() {

        $userModel = new User();
        $userId = $userModel->createUser();
        $data['success'] = true;
        $data['userId'] = $userId;

        return response()->json($data);
    }

    /** RATE: LIKE / DISLIKE EVENT **/
    public function rate() {

        $params = $_POST;
        $userEventModel = new Rating();
        $userEventModel->rate($params);
        $data['success'] = true;

        return response()->json($data);
    }

    /** GET RATINGS **/
    public function getratings() {

        $params = $_GET;
        $userEventModel = new Rating();
        $ratings = $userEventModel->getRatings($params);
        $data['success'] = true;
        $data['ratings'] = $ratings;

        return response()->json($data);
    }

}
