<?php

use App\Lib\Functions;
use Illuminate\Foundation\Testing\WithoutMiddleware;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Illuminate\Foundation\Testing\DatabaseTransactions;

class InitialLoadTest extends TestCase {

    public function testInitialLoadIsValid() {

        $url = env('APP_URL');
        $client = new GuzzleHttp\Client();
        $response = $client->request('GET', $url . '/api/getcards?category%5B%5D=all&place%5B%5D=all&date%5B%5D=all&page=1');
        $json = $response->getBody(true);

        // Correct 200 header response
        $this->assertEquals(200, $response->getStatusCode());

        // Correct JSON response
        $this->assertEquals('application/json', $response->getHeaderLine('content-type'));

        // Correct JSON string
        $this->assertTrue(Functions::isJson($json));

        // Correct JSON structure
        $array = json_decode($json, true);
        $this->assertArrayHasKey('cards', $array);
        $this->assertArrayHasKey('html', $array);
    }

}
