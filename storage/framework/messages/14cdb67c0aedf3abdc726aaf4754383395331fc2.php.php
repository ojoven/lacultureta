<?php

namespace App\Http\Controllers;

use App\Lib\DateFunctions;
use App\Lib\Functions;
use App\Models\Category;
use App\Models\Event;
use App\Models\Place;
use App\Models\Scraper;
use App\Models\Twitter;
use Illuminate\Http\Request;
use App\Http\Requests;

// Models

class IndexController extends Controller {

    public function index($language = 'es') {

        Functions::setLocale($language);

        // GET CATEGORIES
        $categoryModel = new Category();
        $data['categories'] = $categoryModel->getCategories();

        // GET PLACES
        $placeModel = new Place();
        $data['places'] = $placeModel->getPlaces();

        // LANGUAGE
        $data['language'] = Functions::getUserLanguage($language);
        return view('index', $data);
    }

    public function playground() {

        // Code to play with here
        $twitterModel = new Twitter();
        $schedule = array(array(1, 1, 4, '09.00', 'resume', 'weekend', false));
        $schedule = $twitterModel->parseScheduleTemplates($schedule);
        $tweet = $twitterModel->prepareTweet($schedule[0]);
        if ($tweet) {
            // If everything alright, we send it
            $response = $twitterModel->sendTweet($tweet['message'], $tweet['image']);
        }

        return view('playground');

    }

    public function scraper() {

        $scraperModel = new Scraper();
        $scraperModel->extractDataEvents();

        return view('playground');
    }

}
