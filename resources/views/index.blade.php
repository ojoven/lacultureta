<!DOCTYPE html>
<html lang="en">

    <head>
        <!-- LE META -->
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- LE TITLE -->
        <title>La Cultureta | Tu Agenda de Eventos de Donostia</title>

        <!-- LE STYLES -->
        <link href="https://fonts.googleapis.com/css?family=Amatic+SC|Raleway" rel="stylesheet">
        <link href="/css/style.css?v=1" rel="stylesheet">

    </head>

    <body draggable="false">

        <!-- HEADER -->
        @include('partials/header')

        <!-- VIEWPORT -->
        <div id="viewport">

            <!-- CARDS -->
            <ul class="cards">

                <!-- WELCOME CARD -->
                @include('partials/welcome')

            </ul>

            <!-- NO CARDS -->
            @include('partials/no-cards')

        </div>

        <!-- SINGLE EVENT POPUP -->
        @include('partials/single-event')

        <!-- SETTINGS -->
        @include('partials/settings')

        <!-- LIKE DISLIKE -->
        @include('partials/like-dislike')

        <script type="text/javascript" src="/js/app.min.js"></script>

    </body>

</html>
