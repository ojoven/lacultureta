<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Hoy No Hay Nada | Tu Agenda de Eventos de Donostia</title>

        <link href="https://fonts.googleapis.com/css?family=Permanent+Marker|Roboto" rel="stylesheet">
        <link href="/css/style.css" rel="stylesheet">

    </head>
    <body>

        <!-- HEADER -->
        <header id="main-header">
            <div id="logo"></div>
        </header>

        <div id="subheader">
            <h2>No te pierdas los mejores eventos de Donostia</h2>
        </div>

        <!-- VIEWPORT -->
        <div id="viewport">
            <ul class="cards">

                <?php foreach ($events as $event) { ?>

                    <li>
                        <div class="title"><?php echo $event['title']; ?></div>
                        <div class="image" style="background-image: url(<?php echo $event['image']; ?>);"></div>
                        <div class="date">
                            <span class="day"><?php echo $event['date_render']; ?></span>
                            <span class="hour"><?php echo $event['hour_render']; ?></span>
                            <!--<a href="<?php echo $event['url']; ?>" target="_blank">LINK</a>-->
                        </div>
                        <div class="price"><?php echo $event['price_render']; ?></div>
                        <div class="place"><?php echo $event['place']; ?></div>
                    </li>

                <?php } ?>

            </ul>
        </div>

        <a href="#" id="to-dislike">Dislike</a>
        <a href="#" id="to-like">Like</a>

        <br><br>
        <a href="/scraper">Test Scraper</a>

        <script type="text/javascript" src="/js/app.min.js"></script>
    </body>

</html>
