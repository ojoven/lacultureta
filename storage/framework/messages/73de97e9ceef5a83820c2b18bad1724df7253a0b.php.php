<?php
/** ==================================================
 * FRIEND CARD (#amigosdelacultureta)
 ===================================================== **/

// Get some extra params (classes and counts)
$classTitle = (strlen($friend['title']) > 50) ? ' little' : '';
$urlText = isset($friend['urlText']) ? $friend['urlText'] : $friend['url']
?>

<li class="card friend-card uses-ribbon no-popup">
    <div class="title<?php echo $classTitle; ?>">
        <?php echo $friend['title']; ?>
    </div>
    <div class="image" style="background-image: url(<?php echo $friend['image']; ?>);"></div>
    <div class="description"><?php echo $friend['description']; ?></div>
    <a target="_blank" href="<?php echo $friend['url']; ?>" class="link"><?php echo $urlText; ?></a>
    <span class="ribbon"><span><?php echo __("#amigas"); ?></span></span>
    <span class="friends-hashtag"><?php echo __("#amigasdelacultureta"); ?></span>
</li>