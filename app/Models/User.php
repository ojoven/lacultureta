<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class User extends Model {

	protected $fillable = ['userId'];

	public function createUser() {

		$userId = $this->_generateUniqueUserId();
		$user = new self();
		$user->userId = $userId;
		$user->save();

		return $userId;
	}

	private function _generateUniqueUserId() {

		$userId = uniqid(); // Ok, this is not a bank, guys!
		return $userId;

	}

}