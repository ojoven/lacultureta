<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Model;
require_once app_path() . '/Lib/Vendor/codebird/src/Codebird.php';

class Twitter extends Model {

	protected $cb; // codebird (auxiliar wrapper to post tweets)

	public function initialize() {

		// Codebird
		\Codebird::setConsumerKey(config('twitter.consumer_key'), config('twitter.consumer_secret'));
		$this->cb = \Codebird::getInstance();
		$this->cb->setToken(config('twitter.oauth_token'), config('twitter.oauth_secret'));

	}

	// Twitter Scheduler
	// We'll call this function every 30 minutes or so with a cron job
	public function twitterScheduler() {

		// id, days of week, hour, template, date target, response to previous tweet
		$arraySchedule = array(
			array(1, 'monday>thursday', '09.00', 'first', 'today', false),
			array(2, 'monday>thursday', '09.02', 'second', 'today', true),
			array(3, 'monday>thursday', '09.10', 'resume', 'today', true),
			array(4, 'monday>thursday', '14.10', 'resume', 'afternoon', false),
			array(5, 'monday>wednesday', '21.10', 'resume', 'tomorrow', false),
			array(6, 'thursday', '21.00', 'first', 'weekend', false), // weekend: friday, saturday and sunday
			array(7, 'thursday', '21.02', 'second', 'weekend', true),
			array(8, 'thursday', '21.10', 'resume', 'weekend', true),
			array(9, 'friday', '09.00', 'resume', 'weekend', false),
			array(10, 'friday', '14.00', 'resume', 'weekend', false),
			array(11, 'saturday', '10.00', 'first', 'today', false),
			array(12, 'saturday', '10.01', 'resume', 'today', true),
			array(13, 'saturday', '10.02', 'resume', 'tomorrow', true),
			array(14, 'sunday', '09.30', 'resume', 'today', false),
		);


	}

	public function sendTweet($message, $mediaId = false) {

		// First we initialize Codebird
		$this->initialize();

		// We build the params array
		$params = array('status' => $message);

		// Any photos to upload?
		if ($mediaId) {
			$params['media_ids'] = $mediaId;
		}

		// And we send the tweet
		$tweet = $this->cb->statuses_update($params);
	}

}