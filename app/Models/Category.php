<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class Category extends Model {

	public function getCategories() {

		// TODO: Add this to DB
		$arrayCategories = array(
			'Actividades Infantiles',
			'Cine',
			'Conferencias',
			'Deportes',
			'Exposiciones',
			'Fiestas y Ferias',
			'Gastronomía',
			'Literatura',
			'Museos',
			'Música',
			'Teatro y Danza',
			'Otros'
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