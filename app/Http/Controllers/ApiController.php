<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Requests;

// Models

class ApiController extends Controller {

    // GET CARDS
    public function getcards() {

        $params = $_GET;

        $eventModel = new Event();
        $events = $eventModel->getEvents($params);

        return view('cards', array('events' => $events));
    }

    public function createuser() {

        $userModel = new User();
        $userId = $userModel->createUser();
        $data['success'] = true;
        $data['userId'] = $userId;

        return response()->json($data);
    }

}
