<?php

namespace App\Models\CustomCards;
use Illuminate\Database\Eloquent\Model;

class Friend extends Model {

	/** GET **/
	public function getCard($friendId) {

		$card = false;

		// 4 params: title, image, description and URL
		switch ($friendId) {

			case 'LasMejoresPeliculas':
				$card['title'] = __('¿Eres cinéfilo?');
				$card['image'] = false;
				$card['description'] = __('Descubre las mejores películas de actores y directores de la historia del cine; otra aplicación con una interfaz muy sencilla del creador de La Cultureta'); // @codingStandardsIgnoreLine
				$card['url'] = 'http://lasmejorespeliculas.de';
				break;
		}

		if ($card) {
			$card['type'] = 'friend';
		}

		return $card;
	}

}
