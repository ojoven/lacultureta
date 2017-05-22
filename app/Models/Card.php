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

		// GET CUSTOM CARDS
		$customCardsConfiguration = $this->getCustomCardConfiguration();
		$customCards = $this->getCustomCards($customCardsConfiguration);

		// INTEGRATE EVENTS AND CUSTOM CARDS
		$cards = $this->integrateCustomCards($events, $cards, $customCardsConfiguration);

		$cards = $events;
		return $cards;

	}

	public function getCustomCardConfiguration() {

		// Model/Template, Identifier, Page, Position
		$arrayConfig = array(
			array('template' => 'Ego', 'id' => 'Ego', 'page' => 1, 'position' => 3),
			array('template' => 'Friend', 'id' => 'LasMejoresPeliculas', 'page' => 2, 'position' => 4),
		);

		return $arrayConfig;

	}

	public function getCustomCards($customCardsConfiguration) {

		$customCards = [];
		foreach ($customCardsConfiguration as $cardConfig) {
			$pathToCustomCards = app_path() . '/Models/CustomCards/';
			if (!file_exists($pathToCustomCards . $cardConfig['template'] . '.php')) continue;

			$cardModelClass = 'App\\Models\\CustomCards\\' . $cardConfig['template'];
			$cardModel = new $cardModelClass;
			$card = $cardModel->getCard($cardConfig['id']);
			$card['config'] = $cardConfig;
			$customCards[] = $card;
		}

		return $customCards;
	}

	public function integrateCustomCards($events, $customCards, $customCardsConfiguration) {

	}

}
