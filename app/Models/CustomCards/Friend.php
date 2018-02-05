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

			case 'TheMeleeFusion':
				$card['title'] = __('¡Encuentro de diseñadoras y programadoras* en The Mêlée!');
				$card['image'] = '/img/friends/themeleefusion.jpg';
				$card['description'] = __('Este viernes 9 en la sala Keler ven a conocer a la comunidad The Mêlée y disfruta con la charlas de Ricardo Félix y Diego Rodríguez.<br><br><span style="font-size:11px;line-height: 1;">* Personas. Mujeres y hombres bienvenidas en una comunidad de aspiración diversa.</span>'); // @codingStandardsIgnoreLine
				$card['url'] = 'http://themelee.org/post/169964774746/the-m%C3%AAl%C3%A9e-dise%C3%B1o-y-desarrollo-fusi%C3%B3n';
				$card['urlText'] = "¡Anímate y haz click aquí!";
				break;
		}

		if ($card) {
			$card['type'] = 'friend';
		}

		return $card;
	}

}
