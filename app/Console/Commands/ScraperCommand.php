<?php

namespace App\Console\Commands;

use Log;
use App\Builder\Builder;
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
        echo "HEY!" . PHP_EOL;
        //$builder = new Builder();
        //$builder->build($this->argument('task'), $this->argument('lang'), $this->argument('additional'));
    }
}
