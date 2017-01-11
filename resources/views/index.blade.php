<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title>Hoy No Hay Nada | Tu Agenda de Eventos de Donostia</title>

        <link href="https://fonts.googleapis.com/css?family=Raleway|Neucha" rel="stylesheet">
        <link href="/css/style.css" rel="stylesheet">

    </head>
    <body draggable="false">

        <!-- HEADER -->
        <header id="main-header">
            <!--<div id="logo"></div>-->
            <div id="logo-text">hoy no hay nada</div>

            <nav class="menu-right">
                <a href="#" class="icon-header icon-settings to-settings"></a>
            </nav>
        </header>

        <div id="subheader">
            <h2>No te pierdas los mejores eventos de Donostia</h2>
        </div>

        <!-- VIEWPORT -->
        <div id="viewport">

            <!-- CARDS -->
            <ul class="cards">

                <li class="welcome">
                    <div class="title">Bienvenido a<br>hoy no hay nada</div>
                    <p>Aquí encontrarás ¡al fin! todos los eventos culturales de Donostia.</p>
                    <p>Conciertos, exposiciones, películas, teatros...</p>
                    <div class="swipe swipe-left">
                        <div class="icon-swipe"></div>
                        <div class="swipe-message">Desliza a la izquierda si el evento no te gusta</div>
                    </div>

                    <div class="swipe swipe-right">
                        <div class="icon-swipe"></div>
                        <div class="swipe-message">Desliza a la derecha si el evento te gusta</div>
                    </div>

                    <div class="warning-tmp">(proyecto en construcción)</div>

                </li>

            </ul>

            <!-- LIKE / DISLIKE -->
            <div class="dislike"></div>
            <div class="like"></div>

            <div class="popup">
                <h2 style="margin: 30px auto; text-align: center;text-transform: uppercase; font-weight: normal;">Podrás añadir filtros aquí</h2>
                <p style="text-align: center; display: block; width: 100%; margin: 10px auto;">Toca en cualquier lugar<br>para cerrar el popup</p>
            </div>
        </div>

        <script type="text/javascript" src="/js/app.min.js"></script>
    </body>

</html>
