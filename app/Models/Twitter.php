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