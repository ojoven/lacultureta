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
	// We'll call this function every 5 minutes or so with a cron job
	public function twitterScheduler() {

		// id, days of week (first, last), hour, template, date target, response to previous tweet
		$schedule = array(
			array(1, 1, 4, '09.00', 'first', 'today', false),
			array(2, 1, 4, '09.05', 'second', 'today', true),
			array(3, 1, 4, '09.10', 'resume', 'today', true),
			array(4, 1, 4, '14.10', 'resume', 'afternoon', false),
			array(5, 1, 3, '21.10', 'resume', 'tomorrow', false),
			array(6, 4, 4, '21.00', 'first', 'weekend', false), // weekend: friday, saturday and sunday
			array(7, 4, 4, '21.05', 'second', 'weekend', true),
			array(8, 4, 4, '21.10', 'resume', 'weekend', true),
			array(9, 5, 5, '09.00', 'resume', 'weekend', false),
			array(10, 5, 5, '14.00', 'resume', 'weekend', false),
			array(11, 6, 6, '10.00', 'first', 'today', false),
			array(12, 6, 6, '10.05', 'resume', 'today', true),
			array(13, 6, 6, '10.10', 'resume', 'tomorrow', true),
			array(14, 7, 7, '09.30', 'resume', 'today', false),
			array(14, 7, 7, '21.30', 'resume', 'week', false),
		);


		if ($template = $this->isTimeToSendATweet($schedule)) {

			$tweet = $this->prepareTweet($template);
			$this->sendTweet($tweet['message'], $tweet['mediaId']);

		}


	}

	public function isTimeToSendATweet($schedule) {

		// First we check the hour, if it's equal to one of the schedules, we check the day
		$currentHour = date('H.i');
		$currentDay = date('N');

		foreach ($schedule as $template) {

			if ($currentHour == $template[3] && ($currentDay >= $template[1] && $currentDay >= $template[1])) {
				return $template;
			}

		}

		return false;
	}

	public function prepareTweet($template) {

		// array(1, 1, 4, '09.00', 'first', 'today', false),

		// We get the image for the tweet
		// We'll use PhantomJS with a dynamically generated HTML view
		$this->getImageTweet($template);
		// Now we filter by date




		$tweet = $template;
		return $tweet;

	}

	public function getImageTweet($template) {

		// $template[4]; // first, second, resume
		// $template[5]; // today, tomorrow, weekend, week

		switch ($template[4]) {
			case 'first':
			case 'second':
				$view = 'single';
				break;
			case 'resume':
			default:
				$view = 'resume';
		}

		$params = array(
			'place' => 'all',
			'category' => 'all',
			'date' => $template[5],
			'template' => $template[4]
		);

		$url = url('/') . '/resume/' . $view . '?';
		$url .= http_build_query($params);

	}

	public function buildFrontendTemplate($events, $templateEvent) {

		// First
		$data['event'] = $events[0];
		$view = 'single';

		// Second
		$data['event'] = $events[1];
		$view = 'single';

		// Resume
		$data['events'] = $events;
		$view = 'resume';



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