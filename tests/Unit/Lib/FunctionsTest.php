<?php

use App\Lib\Functions;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class FunctionsTest extends TestCase {

    /** GET ARRAY WITH INDEX VALUES **/
    public function testGetArrayWithIndexValues() {

        // Empty Array with any index returns empty array
        $emptyArray = [];
        $index = 'any';
        $this->assertEquals($emptyArray, Functions::getArrayWithIndexValues($emptyArray, $index));
    }

}
