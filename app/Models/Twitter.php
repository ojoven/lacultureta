<?php

namespace App\Models;
use App\Lib\Functions;
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

		// id, days of week (first, last), hour, template, date target, category, place, response to previous tweet
		$schedule = array(
			array(1, 1, 4, '09.00', 'first', 'today', 'all', 'all', false),
			array(2, 1, 4, '09.05', 'second', 'today', 'all', 'all', true),
			array(3, 1, 4, '09.10', 'resume', 'today', 'all', 'all', true),
			array(4, 1, 4, '14.10', 'resume', 'today', 'all', 'all', false),
			array(5, 1, 3, '21.10', 'resume', 'tomorrow', 'all', 'all', false),
			array(6, 4, 4, '21.00', 'first', 'weekend', 'all', 'all', false), // weekend: friday, saturday and sunday
			array(7, 4, 4, '21.05', 'second', 'weekend', 'all', 'all', true),
			array(8, 4, 4, '21.10', 'resume', 'weekend', 'all', 'all', true),
			array(9, 5, 5, '09.00', 'resume', 'weekend', 'all', 'all', false),
			array(10, 5, 5, '14.00', 'resume', 'weekend', 'all', 'all', false),
			array(11, 6, 6, '10.00', 'first', 'today', 'all', 'all', false),
			array(12, 6, 6, '10.05', 'resume', 'today', 'all', 'all', true),
			array(13, 6, 6, '10.10', 'resume', 'tomorrow', 'all', 'all', true),
			array(14, 7, 7, '09.30', 'resume', 'today', 'all', 'all', false),
			array(14, 7, 7, '21.30', 'resume', 'week', 'all', 'all', false),
		);

		// We convert the schedule to an associative array (for readability)
		$schedule = $this->parseScheduleTemplates($schedule);

		// We get the template from the schedule, based on the current day and hour
		$template = $this->getTemplateFromSchedule($schedule);

		// Is time to send a tweet? We just check if there's a template
		if (!$this->isTimeToSendATweet($template)) {
			Functions::log("It's not time to send a tweet");
			return false;
		}

		// We add the language to the template; random (to be optimized?)
		$languages = array('es', 'eu');
		$template['language'] = $languages[array_rand($languages)];
		Functions::setLocaleFromLanguage($template['language']);

		if (!$this->areThereEventsForTemplate($template)) {
			Functions::log("There are no events for this template");
			return false;
		}

		// We prepare the tweet
		$tweet = $this->prepareTweet($template);
		if ($tweet) {

			Functions::log($tweet);

			// If everything alright, we send it
			$this->sendTweet($tweet['message'], $tweet['image']);
		}
	}

	public function getTemplateFromSchedule($schedule) {

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

	public function areThereEventsForTemplate($template) {

		$params = $this->getEventFilterParamsFromTemplate($template);
		Functions::log($params);
		$eventModel = new Event();
		$events = $eventModel->getEventsForResume($params);
		return ($events) ? true : false;

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
			$parsedTemplate['category'] = $template[6];
			$parsedTemplate['place'] = $template[7];
			$parsedTemplate['reply'] = $template[8];

			$parsedSchedule[] = $parsedTemplate;

		}

		return $parsedSchedule;

	}

	// Is time to send a tweet?
	public function isTimeToSendATweet($template) {

		return $template ? true : false;

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

	// Get image Tweet
	public function getImageTweet($template) {

		$url = $this->getResumeUrlFromTemplate($template);
		$image = $this->createImageFromUrl($url);

		return $image;

	}

	public function getResumeUrlFromTemplate($template) {

		$view = $this->getViewFromTemplate($template);
		$params = $this->getEventFilterParamsFromTemplate($template);
		$url = $this->getResumeUrlFromViewAndParameters($view, $params);

		return $url;
	}

	public function getViewFromTemplate($template) {

		switch ($template['template']) {
			case 'first':
			case 'second':
				$view = 'single';
				break;
			case 'resume':
			default:
				$view = 'resume';
		}

		return $view;
	}

	public function getEventFilterParamsFromTemplate($template) {

		Functions::log($template);

		$params = array(
			'category' => $template['category'],
			'place' => $template['place'],
			'date' => $template['date_target'],
			'template' => $template['template'],
			'language' => $template['language']
		);

		return $params;
	}

	public function getResumeUrlFromViewAndParameters($view, $params) {

		$url = url('/') . '/resume/' . $view . '?';
		$url .= http_build_query($params);

		return $url;
	}

	public function createImageFromUrl($url) {

		// We define the paths for Phantom script and to be generated image
		$pathToPhantomJs = app_path() . '/Lib/' . "phantom/resume.js";
		$pathToScreenshot = public_path() . "/img/tmp/resume.png";

		// We execute the phantom script via command line
		//$pathToPhantomBin = "/usr/local/bin/phantomjs";
		$pathToPhantomBin = "/usr/bin/phantomjs";
		$command = $pathToPhantomBin . " '" . $pathToPhantomJs .  "' '" . $url . "' '" . $pathToScreenshot . "' png";
		$return = shell_exec($command);

		// Some logs
		Functions::log($command);
		Functions::log($return);

		// Return image if success or false if error
		$image = ($return == 'success' . PHP_EOL) ? $pathToScreenshot : false;

		return $image;

	}

	// Prepare message
	public function prepareMessage($template) {

		$arrayMessages = array();

		switch ($template['date_target']) {

			case 'today':
				$dateString = __('hoy');
				break;
			case 'tomorrow':
				$dateString = __('mañana');
				break;
			case 'weekend':
				$dateString = __('este finde');
				break;
			case 'week':
			default:
				$dateString = __('la próxima semana');
				break;

		}

		if ($template['template'] == 'first'
			|| $template['template'] == 'second') {

			$arrayMessages = array(
				__('Evento interesante %s, más info en http://lacultureta.com', $dateString),
				__('%s tienes un buen plan, recuerda que hay mucho más en http://lacultureta.com', ucfirst($dateString))
			);

		} else if ($template['template'] == 'resume') {

			$arrayMessages = array(
				__('Eventos en Donostia para %s http://lacultureta.com', $dateString),
				__('Mira qué planes chulos para %s, más en http://lacultureta.com', $dateString)
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
		$response = $this->cb->statuses_update($params);

		return $response;
	}

}