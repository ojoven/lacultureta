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
        <link href="/css/style.css?v=2" rel="stylesheet">

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

        </div>

        <!-- SINGLE EVENT POPUP -->
        <?php echo $__env->make('partials/single-event', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

        <!-- SETTINGS -->
        <?php echo $__env->make('partials/settings', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>
        <?php echo $__env->make('partials/user-settings', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

        <!-- FOOTER -->
        <?php echo $__env->make('partials/footer', array_except(get_defined_vars(), array('__data', '__path')))->render(); ?>

        <script>
            var browserLang = '<?php echo substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2); ?>';
        </script>

        <script type="text/javascript" src="/js/app.min.js?v=3"></script>

    </body>

</html>
