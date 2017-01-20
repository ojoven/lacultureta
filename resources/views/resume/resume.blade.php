<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>Resume | Resume</title>

    <link href="https://fonts.googleapis.com/css?family=Raleway|Neucha" rel="stylesheet">
    <link href="/css/style.css" rel="stylesheet">
</head>

<body draggable="false">

    <div class="resume">

        <ul class="events">

            <?php foreach ($events as $event) { ?>

            <li>
                <<?php
            </li>

            <?php } ?>

        </ul>

        <div id="viewport">

            <!-- CARDS -->
            <ul class="cards">

                <?php
                $classTitle = (strlen($event['title']) > 50) ? ' little' : '';
                $classDay = (strlen($event['date_render']) > 30) ? ' little' : '';
                $classHour = (strlen($event['hour_render']) > 30) ? ' little' : '';
                ?>

                <li class="card" id="resume">
                    <div class="title<?php echo $classTitle; ?>">
                        <?php echo $event['title']; ?>
                    </div>
                    <div class="image" data-image="<?php echo $event['image']; ?>" style="background-image: url(<?php echo $event['image']; ?>);"></div>
                    <div class="date">
                        <span class="day<?php echo $classDay; ?>"><?php echo $event['date_render']; ?></span>
                        <span class="hour<?php echo $classHour; ?>"><?php echo $event['hour_render']; ?></span>
                    </div>
                    <div class="price"><?php echo $event['price_render']; ?></div>
                    <div class="place"><?php echo $event['place']; ?></div>
                    <div class="categories">
                        <?php foreach ($event['categories_render'] as $category) { ?>
                        <div class="category" style="background-image:url(../img/categories/<?php echo str_replace(' ', '', $category); ?>.png);">
                        </div>
                        <?php } ?>
                    </div>
                    <div class="description hidden"><?php echo $event['description']; ?></div>
                    <div class="info hidden">
                        <?php echo $event['info']; ?>
                        <p><a target="_blank" href="<?php echo $event['url']; ?>">Enlace a <?php echo $event['source']; ?></a></p>
                    </div>
                </li>

            </ul>
        </div>

    </div>

</body>

</html>
