<?php

namespace App\Models;
use App\Lib\DateFunctions;
use App\Lib\Functions;
use App\Lib\CacheFunctions;
use App\Lib\RenderFunctions;
use Illuminate\Database\Eloquent\Model;

class Card extends Model {

	/** GET **/
	public function getCards($params) {

		// GET EVENTS
		$eventModel = new Event();
		$events = $eventModel->getEvents($params);

		// TODO: GET CUSTOM CARDS


		$cards = $events;
		return $cards;

	}

}
