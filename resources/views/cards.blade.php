<?php foreach ($cards as $card) { ?>

    @include('cards/event', ['event' => $card])

<?php }