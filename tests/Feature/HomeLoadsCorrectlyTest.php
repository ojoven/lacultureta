<?php

use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class HomeLoadsCorrectlyTest extends TestCase {

    public function testHomePageLoadsSuccessfully() {

        $this->visit('/')
             ->see('La Cultureta');
    }

    public function testSpanishVersionLoadsWelcomeCardSuccesfully() {

        $this->visit('/')
            ->see('Bienvenido');
    }

    public function testBasqueVersionLoadsWelcomeCardSuccesfully() {

        $this->visit('/eu')
            ->see('Ongi Etorri');
    }

}
