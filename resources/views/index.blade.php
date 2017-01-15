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

        <div class="container">

            <div class="margin-breaker"></div>

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

                    <li class="card welcome">
                        <div class="title">Bienvenido a<br>hoy no hay nada</div>
                        <p>Aquí encontrarás ¡al fin! todos los eventos culturales de Donostia.</p>
                        <p>Conciertos, exposiciones, películas, teatros...</p>

                        <div class="swipe swipe-left">
                            <div class="icon-swipe"></div>
                            <div class="swipe-message">Desliza a la izquierda si no te interesa el evento</div>
                        </div>

                        <div class="swipe swipe-center">
                            <div class="icon-swipe"></div>
                            <div class="swipe-message">Presiona en la carta para ver más info del evento</div>
                        </div>

                        <div class="swipe swipe-right">
                            <div class="icon-swipe"></div>
                            <div class="swipe-message">Desliza a la derecha si te interesa el evento y quieres guardarlo</div>
                        </div>

                        <div class="warning-tmp">(proyecto en construcción)</div>

                    </li>

                </ul>

                <div class="no-cards">
                    <span class="title">Ooops, ¡ya no hay más!</span>
                    <span class="message">Sigue enterándote de los mejores eventos utilizando los filtros</span>
                    <a href="#" class="icon-settings to-settings"></a>
                </div>

            </div>

            <!-- SINGLE EVENT POPUP -->
            <div id="single-event-popup" class="popup">
                <div class="popup-container">

                    <!-- SINGLE EVENT -->
                    <div class="single-event">

                        <div class="image"></div>
                        <div class="title"></div>
                        <div class="description"></div>
                        <div class="info"></div>

                    </div>

                </div>
                <a href="#" class="popup-close"></a>
            </div>

            <!-- SETTINGS -->
            <div id="settings-popup" class="popup">

                <div class="popup-container">

                    <div class="settings">

                        <div class="title">Filtra los eventos</div>

                        <!-- BY DATE -->
                        <div class="section">
                            <div class="section-title">Por fecha</div>
                            <ul class="data-date">
                                <li>
                                    <a href="#" class="active filter" data-filter="date" data-value="all" data-exclusive="true">
                                        Todas las fechas
                                    </a>
                                </li>
                                <li>
                                    <a href="#" class="filter" data-filter="date" data-value="today">
                                        Hoy
                                    </a>
                                </li>
                                <li>
                                    <a href="#" class="filter" data-filter="date" data-value="tomorrow">
                                        Mañana
                                    </a>
                                </li>
                                <li>
                                    <a href="#" class="filter" data-filter="date" data-value="week" data-exclusive="true">
                                        Próximos 7 días
                                    </a>
                                </li>
                            </ul>
                            <div class="clear"></div>
                        </div>

                        <!-- BY CATEGORY -->
                        <div class="section">
                            <div class="section-title">Por categoría</div>

                            <ul class="select-deselect">
                                <li>
                                    <a href="#" class="select-all">Seleccionar todas</a>
                                </li>

                                <li>
                                    <a href="#" class="deselect-all">No seleccionar ninguna</a>
                                </li>
                            </ul>
                            <div class="clear"></div>

                            <ul class="data-category">
                                <?php foreach ($categories as $category) { ?>
                                <li>
                                    <a href="#" class="filter active" data-filter="category" data-value="<?php echo $category['name']; ?>">
                                        <div class="category-image" style="background-image:url(<?php echo $category['image']; ?>)"></div>
                                        <span class="category-title"><?php echo $category['name']; ?></span>
                                    </a>
                                </li>
                                <?php } ?>
                            </ul>
                            <div class="clear"></div>
                        </div>

                        <!-- BY PLACE -->
                        <div class="section">
                            <div class="section-title">Por lugar</div>

                            <ul class="select-deselect">
                                <li>
                                    <a href="#" class="select-all">Seleccionar todos</a>
                                </li>

                                <li>
                                    <a href="#" class="deselect-all">No seleccionar ninguno</a>
                                </li>
                            </ul>
                            <div class="clear"></div>

                            <ul class="data-place">
                                <?php foreach ($places as $place) { ?>
                                <li>
                                    <a href="#" class="filter active" data-filter="place" data-value="<?php echo $place['name']; ?>">
                                        <div class="place-name"><?php echo $place['name']; ?></div>
                                    </a>
                                </li>
                                <?php } ?>
                            </ul>
                            <div class="clear"></div>
                        </div>

                    </div>

                </div>

                <a href="#" class="save-settings">Guarda</a>
                <div class="settings-error">Debes seleccionar al menos una fecha, una categoría y un lugar.</div>

            </div>

            <script type="text/javascript" src="/js/app.min.js"></script>

        </div>

    </body>

</html>
