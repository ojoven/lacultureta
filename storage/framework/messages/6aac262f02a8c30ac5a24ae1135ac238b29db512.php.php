<?php foreach ($cards as $card) { ?>

    <?php echo $__env->make('cards/' . $card['type'], [$card['type'] => $card], array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

<?php }