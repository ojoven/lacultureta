<?php

namespace App\Console\Commands;

use App\Models\Scraper;
use App\Models\Twitter;
use Log;
use Illuminate\Console\Command;

class TwitterBotCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'twitterbot';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Post event resumes on Twitter';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $currentHour = date('H.i');
        echo $currentHour . PHP_EOL;
        $twitterModel = new Twitter();
        $twitterModel->twitterScheduler();
    }
}
