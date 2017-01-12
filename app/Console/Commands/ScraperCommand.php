<?php

namespace App\Console\Commands;

use App\Models\Scraper;
use Log;
use Illuminate\Console\Command;

class ScraperCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scraper';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Extract the info for the agenda';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        echo "Start scraping..." . PHP_EOL;
        $scraper = new Scraper();
        $scraper->extractDataEvents();
        echo "Finished scraping" . PHP_EOL;
    }
}

// Playground
//$events[0]['url'] = 'https://www.donostia.eus/info/ciudadano/Agenda.nsf/contenido?ReadForm&kwid=128315&kwca=Eventos%20/%20Gratuitas&idioma=cas';
//$events = $scraper->addSinglePageInformation($events);
//print_r($events);
