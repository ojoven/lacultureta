<?php foreach ($events as $event) {
$classTitle = (strlen($event['title']) > 50) ? ' little' : '';
$classDay = (strlen($event['date_render']) > 30) ? ' little' : '';
$classHour = (strlen($event['hour_render']) > 30) ? ' little' : '';
$numLikes = count($event['likes']);
?>

<li class="card v2" data-event="<?php echo $event['id']; ?>">
    
    <div class="image-box" style="background-image: url(<?php echo $event['image']; ?>);">
        <div class="date-box-wrapper">
            <div class="date-box card-container">
                <div class="date">
                    <span class="day<?php echo $classDay; ?>"><?php echo $event['date_render']; ?></span>
                    <span class="hour<?php echo $classHour; ?>"><?php echo $event['hour_render']; ?></span>
                </div>
                <div class="categories">
                    <?php foreach ($event['categories_render'] as $category) { ?>
                    <div class="category" style="background-image:url(../img/categories/<?php echo str_replace(' ', '', $category); ?>.png);">
                    </div>
                    <?php } ?>
                </div>
            </div>
        </div>
    </div>

    <div class="card-container">
        <div class="title<?php echo $classTitle; ?>">
            <?php echo $event['title']; ?>
        </div>
        <div class="price"><i class="fa fa-ticket" aria-hidden="true"></i>
<?php echo $event['price_render']; ?></div>
        <div class="place"><i class="fa fa-map-marker" aria-hidden="true"></i>
<?php echo $event['place']; ?></div>
    </div>
    <div class="likes">
        <div class="card-footer card-container"><i class="fa fa-heart" aria-hidden="true"></i>
        <?php if ($numLikes > 0) { ?>
            <?php if ($numLikes > 1) { ?>
    {{ __('A %s donostiarras les gusta', count($event['likes'])) }}
            <?php } else { ?>
    {{ __('A 1 donostiarra les gusta') }}
            <?php } ?>
        <?php } ?>
        </div>
    </div>
</li>

<?php } ?>