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

    <div id="resume" class="<?php if (count($events['single']) > 3) { echo "week"; } else { echo "not-week"; } ?>">

        <!-- BY DATES -->
        <ul class="dates">

            <?php foreach ($events['single'] as $date) {
                if ($date['events']) {  ?>
                    <li>
                        <span class="title"><?php echo \App\Lib\RenderFunctions::renderDateWeekdayNameDayAndMonth($date['date']); ?></span>
                        <ul class="events">


                                <?php foreach ($date['events'] as $event) { ?>
                                    <li class="event">
                                        <div class="category" style="background-image:url(../img/categories/<?php echo str_replace(' ', '', $event['categories_render'][0]); ?>.png);"></div>
                                        <div class="image" data-image="<?php echo $event['image']; ?>" style="background-image: url(<?php echo $event['image']; ?>);"></div>
                                        <span class="event-title"><?php echo $event['title']; ?></span>
                                        <?php if ($event['hour']) { ?>
                                        <div class="hour">(<?php echo $event['hour']; ?>)</div>
                                        <?php } ?>
                                    </li>
                                <?php } ?>

                        </ul>
                    </li>

            <?php }
                }

                if ($events['range']) { ?>

                <li>
                    <span class="title"><?php echo __("Y también:"); ?></span>
                    <ul class="events">

                        <?php foreach ($events['range'] as $event) { ?>
                        <li class="event">
                            <div class="category" style="background-image:url(../img/categories/<?php echo str_replace(' ', '', $event['categories_render'][0]); ?>.png);"></div>
                            <div class="image" data-image="<?php echo $event['image']; ?>" style="background-image: url(<?php echo $event['image']; ?>);"></div>
                            <span class="event-title"><?php echo $event['title']; ?></span>
                            <?php if ($event['hour']) { ?>
                            <div class="hour">(<?php echo $event['hour']; ?>)</div>
                            <?php } ?>
                        </li>
                        <?php } ?>

                    </ul>
                </li>

                <?php }
                ?>

        </ul>

</body>

</html>
