<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{

	public function getCategories()
	{

		// TODO: Add this to DB
		$arrayCategories = array(
			'Actividades Infantiles' => __('Actividades Infantiles'),
			'Cine' => __('Cine'),
			'Conferencias' => __('Conferencias'),
			'Deportes' => __('Deportes'),
			'Exposiciones' => __('Exposiciones'),
			'Fiestas y Ferias' => __('Fiestas y Ferias'),
			'Gastronomía' => __('Gastronomía'),
			'Literatura' => __('Literatura'),
			'Museos' => __('Museos'),
			'Música' => __('Música'),
			'Teatro y Danza' => __('Teatro y Danza'),
			'Otros' => __('Otros')
		);

		$categories = [];

		foreach ($arrayCategories as $categoryId => $categoryName) {

			$categoryObj['id'] = $categoryId;
			$categoryObj['name'] = $categoryName;
			$categoryObj['image'] = url('/') . '/img/categories/' . str_replace(' ', '', $categoryId) . '.png';
			$categories[] = $categoryObj;
		}

		return $categories;
	}
}
