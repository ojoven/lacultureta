<?php

namespace App\Models;
use App\Lib\Functions;
use Illuminate\Database\Eloquent\Model;

class Rating extends Model {

	protected $fillable = ['userId', 'eventId', 'rating'];

	/** ADD RATING **/
	public function rate($params) {

		// If already rated
		if ($previousRating = $this->hasTheUserRatedPreviouslyTheEvent($params['userId'], $params['eventId'])) {

			// We update the previous rating
			$previousRating->rating = $params['rating'];
			$previousRating->save();
		} else {

			$rating = new self();
			$rating->user_id = $params['userId'];
			$rating->event_id = $params['eventId'];
			$rating->rating = $params['rating'];
			$rating->save();

		}

	}

	public function hasTheUserRatedPreviouslyTheEvent($userId, $eventId) {

		return self::where('user_id', '=', $userId)->where('event_id', '=', $eventId)->first();
	}

	/** GET RATINGS **/
	public function getRatings($params, $rating = false) {

		// We only will serve ratings of events that are currently available (no past events)
		$eventModel = new Event();
		$events = $eventModel->getAllFutureEvents();
		$eventIds = Functions::getArrayWithIndexValues($events, 'id');

		// Get events rated by user
		// If rating, we will filter by rating, too
		if ($rating) {
			$ratings = self::where('user_id', '=', $params['user_id'])->where('rating', '=', $rating)->orderBy('created_at', 'desc')->get()->toArray();
		} else {
			$ratings = self::where('user_id', '=', $params['user_id'])->orderBy('created_at', 'desc')->get()->toArray();
		}

		// Now we filter the events with the currently available
		$finalRatings = array();

		foreach ($ratings as $rating) {

			if (in_array($rating['event_id'], $eventIds)) {
				$finalRatings[] = $rating;
			}
		}

		// We prepare them for front end rendering
		$finalRatings = $this->parseRatings($finalRatings);

		return $finalRatings;
	}

	public function parseRatings($ratings) {

		$parsedRatings = array();
		foreach ($ratings as $rating) {

			$parsedRating = array(
				'eventId' => $rating['event_id'],
				'rating' => $rating['rating'],
			);

			$parsedRatings[] = $parsedRating;
		}

		return $parsedRatings;
	}

	// GET LIKES
	public function getLikesEvent($eventId) {

		return self::where('rating', '=', '1')->where('event_id', '=', $eventId)->get()->toArray();

	}

}