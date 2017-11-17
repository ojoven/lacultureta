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
				$card['image'] = '/img/friends/lasmejorespeliculasde.jpg';
				$card['description'] = __('Descubre las mejores películas de actores y directores de la historia del cine; otra aplicación con una interfaz muy sencilla del creador de La Cultureta'); // @codingStandardsIgnoreLine
				$card['url'] = 'http://lasmejorespeliculas.de';
				break;

			case 'NoeliaLozanoMakingOf':
				$card['title'] = __('¿Eres diseñador/a?');
				$card['image'] = '/img/friends/noelialozano.jpg';
				$card['description'] = __('Este viernes 24 en la sala Keler ven a conocer a la comunidad The Mêlée y disfruta con la charla Making Of que nos va a dar una diseñadora donostiarra muy pro: Noelia Lozano'); // @codingStandardsIgnoreLine
				$card['url'] = 'http://themelee.org/post/167481575436/the-m%C3%AAl%C3%A9e-making-of-con-noelia-lozano';
				$card['urlText'] = "¡Haz click aquí<br>si quieres saber más!";
				break;
		}

		if ($card) {
			$card['type'] = 'friend';
		}

		return $card;
	}

}
