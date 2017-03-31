<div id="user-settings-popup" class="popup settings-popup">

    <div class="popup-container">

        <div class="settings">

            <div class="title">{{ __('Tu perfil') }}</div>

            <!-- IDIOMA -->
            <div class="section">
                <div class="section-title">{{ __('¿En qué idioma quieres ver La Cultureta?') }}</div>

                <div class="option-50">
                    <a href="#" class="select-language<?php if ($language == 'eu') { echo ' active'; } ?>" data-language="eu">{{ __('Euskera')  }}</a>
                </div>

                <div class="option-50">
                    <a href="#" class="select-language<?php if ($language == 'es') { echo ' active'; } ?>" data-language="es">{{ __('Castellano')  }}</a>
                </div>

                <div class="clear"></div>
            </div>

        </div>

    </div>

    <a href="#" class="save-settings">{{ __('Guarda') }}</a>
    <a href="#" class="close-settings"></a>

</div>