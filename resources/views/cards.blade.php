<?php foreach ($events as $event) {
$classTitle = (strlen($event['title']) > 60) ? ' little' : '';
$classDay = (strlen($event['date_render']) > 30) ? ' little' : '';
$classHour = (strlen($event['hour_render']) > 30) ? ' little' : '';
?>

<li>
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
    <div class="to-see-more">
        <a href="<?php echo $event['url']; ?>" target="_blank"><?php echo _('ver más'); ?></a>
    </div>
    <div class="categories">
        <?php foreach ($event['categories_render'] as $category) { ?>
        <div class="category" style="background-image:url(../img/categories/<?php echo str_replace(' ', '', $category); ?>.png);">
        </div>
        <?php } ?>
    </div>
</li>

<?php } ?>