<?php foreach ($cards as $card) { ?>

    @include('cards/' . $card['type'], [$card['type'] => $card])

<?php }