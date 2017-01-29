<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class UserEvent extends Model {

	protected $fillable = ['userId', 'eventId', 'like'];

	public function like($params) {

		// If already rated
		if ($previousUserEvent = $this->hasTheUserLikedPreviouslyTheEvent($params['userId'], $params['eventId'])) {

			// We update the rate parameter and save
			$previousUserEvent->like = $params['like'];
			$previousUserEvent->save();
		} else {

			// If not previous, we create a new row and save
			$userEvent = new self();
			$userEvent->user_id = $params['userId'];
			$userEvent->event_id = $params['eventId'];
			$userEvent->like = $params['like'];
			$userEvent->save();
		}

	}

	public function hasTheUserLikedPreviouslyTheEvent($userId, $eventId) {

		return self::where('user_id', '=', $userId)->where('event_id', '=', $eventId)->get()->toArray();
	}

}