<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Event;
use App\Models\Place;
use App\Models\Scraper;
use App\Models\Twitter;
use Illuminate\Http\Request;
use App\Http\Requests;

// Models

class IndexController extends Controller {

    public function index() {

        // GET CATEGORIES
        $categoryModel = new Category();
        $data['categories'] = $categoryModel->getCategories();

        // GET PLACES
        $placeModel = new Place();
        $data['places'] = $placeModel->getPlaces();

        return view('index', $data);
    }

    public function playground() {

        // Code to play with here
        $twitterModel = new Twitter();
        //$twitterModel->sendTweet('Esto es una prueba, don pepito');

        return view('playground');

    }

    public function scraper() {

        $scraperModel = new Scraper();
        $scraperModel->extractDataEvents();

        return view('playground');
    }

}
