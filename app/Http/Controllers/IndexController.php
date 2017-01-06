<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests;

// Models

class IndexController extends Controller {

    public function index() {

        return view('index');
    }

    public function playground() {

        // Code to play with here


        return view('playground');

    }

}
