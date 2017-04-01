<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Category extends Model {

	public function getCategories() {

		// TODO: Add this to DB
		$arrayCategories = array(
			__('Actividades Infantiles'),
			__('Cine'),
			__('Conferencias'),
			__('Deportes'),
			__('Exposiciones'),
			__('Fiestas y Ferias'),
			__('Gastronomía'),
			__('Literatura'),
			__('Museos'),
			__('Música'),
			__('Teatro y Danza'),
			__('Otros')
		);

		$categories = [];

		foreach ($arrayCategories as $category) {

			$categoryObj['name'] = $category;
			$categoryObj['image'] = url('/') . '/img/categories/' . str_replace(' ', '', $category) . '.png';
			$categories[] = $categoryObj;
		}

		return $categories;

	}

}