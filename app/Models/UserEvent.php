<?php

namespace App\Models;
use App\Lib\Functions;
use Illuminate\Database\Eloquent\Model;

class UserEvent extends Model {

	protected $fillable = ['userId', 'eventId', 'like'];

	/** ADD USER EVENT LIKE **/
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

	/** GET RATINGS **/
	public function getRatings($params) {

		// We only will serve ratings of events that are currently available (no past events)
		$eventModel = new Event();
		$events = $eventModel->getAllFutureEvents();
		$eventIds = Functions::getArrayWithIndexValues($events, 'id');

		// Get events rated by user
		$userEvents = self::where('user_id', '=', $params['user_id'])->get()->toArray();

		// Now we filter the events with the currently available
		$finalUserEvents = array();

		foreach ($userEvents as $userEvent) {

			if (in_array($userEvent['event_id'], $eventIds)) {
				$finalUserEvents[] = $userEvent;
			}
		}

		return $finalUserEvents;
	}

}