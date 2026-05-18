<?php
/**
 * Digits section.
 *
 * @package ISG
 */

$page_id = get_the_ID();

$default_cards = array(
	array('image' => isg_asset_uri('img/advantages_1.jpg'), 'value' => '30,000+', 'label' => 'tons/month'),
	array('image' => isg_asset_uri('img/advantages_1.jpg'), 'value' => '15,000', 'label' => 'm2 facility'),
	array('image' => isg_asset_uri('img/advantages_1.jpg'), 'value' => '24/7', 'label' => 'QC lab'),
	array('image' => isg_asset_uri('img/advantages_1.jpg'), 'value' => 'A1', 'label' => 'highway access'),
	array('image' => isg_asset_uri('img/advantages_1.jpg'), 'value' => 'ISO', 'label' => 'certified'),
);

$section = isg_acf_group(
	'digits_section',
	array(
		'background_image' => isg_asset_uri('img/digits-img.jpg'),
		'title'            => 'Advantages',
		'cards'            => $default_cards,
	),
	$page_id
);

$bg_source = $section['background_image'] ?? '';
$bg_image  = isg_image_url($bg_source, isg_asset_uri('img/digits-img.jpg'));
$bg_size   = isg_image_dimensions($bg_source, 1920, 1080);
$title     = trim((string) ($section['title'] ?? ''));
$cards     = is_array($section['cards'] ?? null) ? $section['cards'] : array();

if ($title === '') {
	$title = 'Advantages';
}

$cards = array_values(
	array_filter(
		$cards,
		static function ($card): bool {
			if (!is_array($card)) {
				return false;
			}

			$value = trim((string) ($card['value'] ?? ''));
			$label = trim((string) ($card['label'] ?? ''));

			return $value !== '' || $label !== '';
		}
	)
);

if (empty($cards)) {
	$cards = array();
}

$normalized_cards = array();
$target_cards     = max(count($default_cards), count($cards));

for ($index = 0; $index < $target_cards; $index++) {
	$card         = is_array($cards[$index] ?? null) ? $cards[$index] : array();
	$default_card = is_array($default_cards[$index] ?? null) ? $default_cards[$index] : $default_cards[0];

	$image = isg_image_url($card['image'] ?? '', '');
	$icon  = isg_image_url($card['icon'] ?? '', '');
	$image_size = isg_image_dimensions($card['image'] ?? '', 582, 650);
	$value = trim((string) ($card['value'] ?? ''));
	$label = trim((string) ($card['label'] ?? ''));

	if ($image === '') {
		$image = isg_image_url($default_card['image'] ?? '', isg_asset_uri('img/advantages_1.jpg'));
	}
	if ($value === '') {
		$value = (string) ($default_card['value'] ?? '');
	}
	if ($label === '') {
		$label = (string) ($default_card['label'] ?? '');
	}

	$normalized_cards[] = array(
		'image'  => $image,
		'icon'   => $icon,
		'value'  => $value,
		'label'  => $label,
		'width'  => $image_size['width'],
		'height' => $image_size['height'],
	);
}

if (empty($normalized_cards)) {
	$normalized_cards = $default_cards;
}

$cards = $normalized_cards;
?>
<section
	id="isg-digits"
	class="isg-digits-section component component--featured"
	data-component="featured"
	data-isg-block="digits"
>
	<div class="scroll" data-isg-featured-scroll>
		<div class="inner" data-isg-featured-inner>
			<div class="image isg-digits-featured__image" role="img" aria-label="">
				<div class="isg-digits-featured__image-media" aria-hidden="true">
					<img
						class="isg-digits-featured__image-img"
						src="<?php echo esc_url($bg_image); ?>"
						alt=""
						width="<?php echo esc_attr((string) $bg_size['width']); ?>"
						height="<?php echo esc_attr((string) $bg_size['height']); ?>"
						loading="eager"
						decoding="async"
						fetchpriority="high"
					/>
				</div>
			</div>
			<div class="cards" data-isg-featured-cards>
				<div class="center">
					<h2 class="title title--large isg-h2"><?php echo esc_html($title); ?></h2>
					<div class="columns columns--start">
						<?php foreach ($cards as $card) : ?>
							<?php
							$card_image = isg_image_url($card['image'] ?? '', isg_asset_uri('img/advantages_1.jpg'));
							$card_alt   = isg_image_alt($card['image'] ?? '', '');
							$icon_url   = isg_image_url($card['icon'] ?? '', '');
							$value      = (string) ($card['value'] ?? '');
							$label      = (string) ($card['label'] ?? '');
							$card_width = (int) ($card['width'] ?? 582);
							$card_height = (int) ($card['height'] ?? 650);
							?>
							<div class="columns__item">
								<article class="card card--featured isg-digit-card">
									<img
										class="isg-digit-card__media"
										src="<?php echo esc_url($card_image); ?>"
										alt="<?php echo esc_attr($card_alt); ?>"
										width="<?php echo esc_attr((string) max(1, $card_width)); ?>"
										height="<?php echo esc_attr((string) max(1, $card_height)); ?>"
										loading="lazy"
										decoding="async"
									/>
									<div class="isg-digit-card__shade" aria-hidden="true"></div>
									<div class="isg-digit-card__container">
										<div class="isg-digit-card__inner">
											<?php if ($icon_url !== '') : ?>
												<span class="isg-digit-card__icon" aria-hidden="true">
													<img src="<?php echo esc_url($icon_url); ?>" alt="" width="48" height="48" loading="lazy" decoding="async" />
												</span>
											<?php endif; ?>
											<p class="isg-digit-card__value"><?php echo esc_html($value); ?></p>
											<p class="isg-digit-card__label"><?php echo esc_html($label); ?></p>
										</div>
									</div>
								</article>
							</div>
						<?php endforeach; ?>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
