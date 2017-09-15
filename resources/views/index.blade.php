<!DOCTYPE html>
<html lang="en">

    <head>
        <!-- LE META -->
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- LE TITLE -->
        <title> {{ __('La Cultureta | Tu Agenda de Eventos de Donostia') }}</title>

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
        @include('partials/ga')

        <!-- HEADER -->
        @include('partials/header')

        <!-- VIEWPORT -->
        <div id="viewport">

            <!-- CARDS -->
            <ul class="cards">

                <!-- WELCOME CARD -->
                @include('partials/welcome')

            </ul>

            <!-- LOADING -->
            @include('partials/loading')

            <!-- NO CARDS -->
            @include('partials/no-cards')

            <!-- FAV/TRASH BUTTONS (DESKTOP) -->
            @include('partials/favtrashbuttons')

        </div>

        <!-- SINGLE EVENT POPUP -->
        @include('partials/single-event')

        <!-- SETTINGS -->
        @include('partials/settings')
        @include('partials/user-settings')

        <!-- FOOTER -->
        @include('partials/footer')

        <script>
            var browserLang = '<?php echo isset($_SERVER['HTTP_ACCEPT_LANGUAGE']) ? substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2) : 'es'; ?>';
        </script>

        <script type="text/javascript" src="/js/app.min.js?v=4"></script>

    </body>

</html>
