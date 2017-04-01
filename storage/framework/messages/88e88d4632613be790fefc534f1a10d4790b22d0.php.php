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

		// We convert the schedule to an associative array (for readability)
		$schedule = $this->parseScheduleTemplates($schedule);

		// We decide, is it time to send a tweet?
		if ($template = $this->isTimeToSendATweet($schedule)) {

			// If yes, we prepare the tweet
			$tweet = $this->prepareTweet($template);
			if ($tweet) {

				// If everything alright, we send it
				$this->sendTweet($tweet['message'], $tweet['image']);
			}
		}

	}

	// PARSE SCHEDULE
	public function parseScheduleTemplates($schedule) {

		$parsedSchedule = array();
		foreach ($schedule as $template) {

			$parsedTemplate['id'] = $template[0];
			$parsedTemplate['day_start'] = $template[1];
			$parsedTemplate['day_end'] = $template[2];
			$parsedTemplate['hour'] = $template[3];
			$parsedTemplate['template'] = $template[4];
			$parsedTemplate['date_target'] = $template[5];
			$parsedTemplate['reply'] = $template[6];

			$parsedSchedule[] = $parsedTemplate;

		}

		return $parsedSchedule;

	}

	// Is time to send a tweet?
	public function isTimeToSendATweet($schedule) {

		// First we check the hour, if it's equal to one of the schedules, we check the day
		$currentHour = date('H.i');
		$currentDay = date('N');

		foreach ($schedule as $template) {

			if ($currentHour == $template['hour'] && ($currentDay >= $template['day_start'] && $currentDay >= $template['day_end'])) {
				return $template;
			}

		}

		return false;
	}

	// Prepare the tweet
	public function prepareTweet($template) {

		// We get the image for the tweet
		// We'll use PhantomJS with a dynamically generated HTML view
		$image = $this->getImageTweet($template);
		if ($image) {

			$tweet['image'] = $image;
			$tweet['message'] = $this->prepareMessage($template);

			return $tweet;
		}

		return false;

	}

	// Get image tweet (generate screenshot)
	public function getImageTweet($template) {

		switch ($template['template']) {
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
			'date' => $template['date_target'],
			'template' => $template['template']
		);

		$url = url('/') . '/resume/' . $view . '?';
		$url .= http_build_query($params);

		$pathToPhantomJs = app_path() . '/Lib/' . "phantom/resume.js";
		$pathToScreenshot = public_path() . "/img/tmp/resume.png";

		$command = "/usr/local/bin/phantomjs '" . $pathToPhantomJs .  "' '" . $url . "' '" . $pathToScreenshot . "' png";
		$return = shell_exec($command);
		$response = ($return == 'success' . PHP_EOL) ? true : false;

		if ($response) {
			chmod($pathToScreenshot, 0777);
			$image = file_get_contents($pathToScreenshot);
		} else {
			$image = false;
		}

		return $image;

	}

	public function prepareMessage($template) {

		$arrayMessages = array();

		switch ($template['date_target']) {

			case 'today':
				$dateString = 'hoy';
				break;
			case 'tomorrow':
				$dateString = 'mañana';
				break;
			case 'weekend':
				$dateString = 'este finde';
				break;
			case 'week':
			default:
				$dateString = 'la próxima semana';
				break;

		}

		if ($template['template'] == 'first'
			|| $template['template'] == 'second') {

			$arrayMessages = array(
				'Evento destacado ' .$dateString,
				ucfirst($dateString) . ' tienes un buen plan',
			);

		} else if ($template['template'] == 'resume') {

			$arrayMessages = array(
				'Eventos en Donostia para ' . $dateString,
				'Mira qué planes chulos para ' . $dateString,
			);

		}

		// We take one at random
		$message = $arrayMessages[array_rand($arrayMessages)];

		return $message;

	}

	public function sendTweet($message, $imagePath) {

		// First we initialize Codebird
		$this->initialize();

		// We build the params array
		$params = array('status' => $message);

		// Any photos to upload?
		if ($imagePath && file_exists($imagePath)) {

			$media = $this->cb->media_upload(array('media' => $imagePath));
			$params['media_ids'] = $media->media_id_string;
		}

		// And we send the tweet
		$tweet = $this->cb->statuses_update($params);
	}

}