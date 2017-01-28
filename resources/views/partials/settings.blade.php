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