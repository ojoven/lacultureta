<?php
/** ==================================================
 * FRIEND CARD (#amigosdelacultureta)
 ===================================================== **/

// Get some extra params (classes and counts)
$classTitle = (strlen($friend['title']) > 50) ? ' little' : '';
?>

<li class="card friend-card">
    <div class="title<?php echo $classTitle; ?>">
        <?php echo $friend['title']; ?>
    </div>
    <div class="image" style="background-image: url(<?php echo $friend['image']; ?>);"></div>
    <div class="description"><?php echo $friend['description']; ?></div>
    <a href="<?php echo $friend['url']; ?>" class="link"><?php echo $friend['url']; ?></a>
    <span class="friend-hashtag"><?php echo __("#amigosdelacultureta"); ?></span>
</li>