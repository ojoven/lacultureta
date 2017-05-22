<?php
/** ==================================================
 * STANDARD EVENT CARD
 ===================================================== **/

// Get some extra params (classes and counts)
$classTitle = (strlen($event['title']) > 50) ? ' little' : '';
$classDay = (strlen($event['date_render']) > 30) ? ' little' : '';
$classHour = (strlen($event['hour_render']) > 30) ? ' little' : '';
$numLikes = count($event['likes']); ?>

<li class="card event-card show-popup" data-event="<?php echo $event['id']; ?>">
    <div class="title<?php echo $classTitle; ?>">
        <?php echo $event['title']; ?>
    </div>
    <div class="image" style="background-image: url(<?php echo $event['image']; ?>);"></div>
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
    <?php if ($numLikes > 0) { ?>
    <?php if ($numLikes > 1) { ?>
    <div class="likes"><?php echo e(__('A %s donostiarras les gusta', count($event['likes']))); ?></div>
    <?php } else { ?>
    <div class="likes"><?php echo e(__('A 1 donostiarra les gusta')); ?></div>
    <?php } ?>
    <?php } ?>
</li>