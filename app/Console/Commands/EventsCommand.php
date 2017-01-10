<?php

namespace App\Console\Commands;

use App\Models\Event;
use Log;
use Illuminate\Console\Command;

class EventsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'events';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Get the events - Test the getEvents function';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $eventModel = new Event();
        $params['category'] = 'Todos';
        $params['page'] = '1';
        $events = $eventModel->getEvents($params);
        foreach ($events as $event) {
            echo $event['date_start'] . ' > ' .$event['date_end'] . ' - ' . $event['title'] . PHP_EOL;
        }
    }
}
