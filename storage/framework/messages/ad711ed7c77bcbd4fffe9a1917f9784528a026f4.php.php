<?php

namespace App\Models\CustomCards;
use Illuminate\Database\Eloquent\Model;

class Ego extends Model {

	/** GET **/
	public function getCard($id) {

		// In this case, the ego card is unique, and so, the id is not necessary
		$card['type'] = 'ego';

		return $card;
	}

}
