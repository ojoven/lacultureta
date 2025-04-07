<div id="settings-popup" class="popup settings-popup">

	<div class="popup-container">

		<div class="settings">

			<div class="title">
				{{ __('Filtra los eventos') }}<br>{{ __('por fecha') }}
			</div>

			<!-- BY DATE -->
			<div class="section">
				<div id="date-selector"></div>
				<input id="data-date" type="hidden" />
				<div class="clear"></div>
			</div>

			<div class="settings-message">
				{{ __('También puedes filtrar...') }}
			</div>

			<!-- BY CATEGORY -->
			<div class="section">
				<div class="section-title">{{ __('Por categoría') }}</div>

				<ul class="select-deselect">
					<li>
						<a href="#" class="select-all">{{ __('Seleccionar todas') }}</a>
					</li>

					<li>
						<a href="#" class="deselect-all">{{ __('No seleccionar ninguna') }}</a>
					</li>
				</ul>
				<div class="clear"></div>

				<ul class="data-category">
					<?php foreach ($categories as $category) { ?>
						<li>
							<a href="#" class="filter active" data-filter="category" data-value="<?php echo $category['id']; ?>">
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
				<div class="section-title">{{ __('Por lugar') }}</div>

				<ul class="select-deselect">
					<li>
						<a href="#" class="select-all">{{ __('Seleccionar todos') }}</a>
					</li>

					<li>
						<a href="#" class="deselect-all">{{ __('No seleccionar ninguno') }}</a>
					</li>
				</ul>
				<div class="clear"></div>

				<ul class="data-place">
					<?php foreach ($places as $place) { ?>
						<?php if ($place['name'] != '') { ?>
							<li>
								<a href="#" class="filter active" data-filter="place" data-value="<?php echo $place['name']; ?>">
									<div class="place-name"><?php echo $place['name']; ?></div>
								</a>
							</li>
						<?php } ?>
					<?php } ?>
				</ul>
				<div class="clear"></div>
			</div>

		</div>

	</div>

	<a href="#" class="save-settings">{{ __('Actualiza') }}</a>
	<a href="#" class="close-settings"></a>
	<div class="settings-error">{{ __('Debes seleccionar al menos una fecha, una categoría y un lugar.') }}</div>

</div>