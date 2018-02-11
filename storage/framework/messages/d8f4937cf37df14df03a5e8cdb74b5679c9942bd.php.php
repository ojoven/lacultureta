<!DOCTYPE html>
<html lang="en">

    <head>
        <!-- LE META -->
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- LE TITLE -->
        <title> <?php echo e(__('La Cultureta | Tu Agenda de Eventos de Donostia')); ?></title>

        <!-- LE STYLES -->
        <link href="https://fonts.googleapis.com/css?family=Amatic+SC|Raleway" rel="stylesheet">
        <link href="/css/style.css?v=4" rel="stylesheet">

        <link rel="apple-touch-icon" sizes="57x57" href="/apple-icon-57x57.png">
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-icon-60x60.png">
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-icon-72x72.png">
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-icon-76x76.png">
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-icon-114x114.png">
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png">
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-icon-144x144.png">
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png">
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png">
        <link rel="icon" type="image/png" sizes="192x192"  href="/android-icon-192x192.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png">
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
        <link rel="manifest" href="/manifest.json">
        <meta name="msapplication-TileColor" content="#ffffff">
        <meta name="msapplication-TileImage" content="/ms-icon-144x144.png">
        <meta name="theme-color" content="#ffffff">

    </head>

    <body draggable="false">

        <!-- GOOGLE ANALYTICS -->
        <?php echo $__env->make('partials/ga', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

        <!-- HEADER -->
        <?php echo $__env->make('partials/header', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

        <!-- VIEWPORT -->
        <div id="viewport">

            <!-- CARDS -->
            <ul class="cards">

                <!-- WELCOME CARD -->
                <?php echo $__env->make('partials/welcome', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

            </ul>

            <!-- LOADING -->
            <?php echo $__env->make('partials/loading', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

            <!-- NO CARDS -->
            <?php echo $__env->make('partials/no-cards', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

            <!-- FAV/TRASH BUTTONS (DESKTOP) -->
            <?php echo $__env->make('partials/favtrashbuttons', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

        </div>

        <!-- SINGLE EVENT POPUP -->
        <?php echo $__env->make('partials/single-event', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

        <!-- SETTINGS -->
        <?php echo $__env->make('partials/settings', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>
        <?php echo $__env->make('partials/user-settings', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

        <!-- FOOTER -->
        <?php echo $__env->make('partials/footer', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

        <script>
            var browserLang = '<?php echo isset($_SERVER['HTTP_ACCEPT_LANGUAGE']) ? substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2) : 'es'; ?>';
            var language = '<?php echo $language; ?>';
        </script>

        <script type="text/javascript" src="/js/app.min.js?v=4"></script>

    </body>

</html>
