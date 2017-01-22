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

<body draggable="false" class="resume-resume">

    <div id="resume">

        <!-- BY DATES -->
        <ul class="dates">

            <?php foreach ($events['single'] as $date) { ?>

            <li>
                <span class="title"><?php echo \App\Lib\RenderFunctions::renderDateWeekdayNameDayAndMonth($date['date']); ?></span>
                <ul class="events">

                    <?php if ($date['events']) {
                        foreach ($date['events'] as $event) { ?>
                            <li class="event">
                                <div class="category" style="background-image:url(../img/categories/<?php echo str_replace(' ', '', $event['categories_render'][0]); ?>.png);"></div>
                                <span class="event-title"><?php echo $event['title']; ?></span>
                            </li>
                        <?php }
                    } else { ?>
                        <span class="no-events">No hay eventos</span>
                    <?php } ?>

                </ul>
            </li>

            <?php } ?>

        </ul>

</body>

</html>
