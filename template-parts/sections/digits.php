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

$bg_image = isg_image_url($section['background_image'] ?? '', isg_asset_uri('img/digits-img.jpg'));
$title    = (string) ($section['title'] ?? 'Advantages');
$cards    = is_array($section['cards'] ?? null) ? $section['cards'] : $default_cards;
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
				<div
					class="isg-digits-featured__image-media"
					style="background-image: url('<?php echo esc_url($bg_image); ?>');"
					aria-hidden="true"
				></div>
			</div>
			<div class="cards" data-isg-featured-cards>
				<div class="center">
					<h2 class="title title--large isg-h2"><?php echo esc_html($title); ?></h2>
					<div class="columns columns--start">
						<?php foreach ($cards as $card) : ?>
							<?php
							$card_image = isg_image_url($card['image'] ?? '', isg_asset_uri('img/advantages_1.jpg'));
							$card_alt   = isg_image_alt($card['image'] ?? '', '');
							$value      = (string) ($card['value'] ?? '');
							$label      = (string) ($card['label'] ?? '');
							?>
							<div class="columns__item">
								<article class="card card--featured isg-digit-card">
									<img
										class="isg-digit-card__media"
										src="<?php echo esc_url($card_image); ?>"
										alt="<?php echo esc_attr($card_alt); ?>"
										loading="lazy"
										decoding="async"
									/>
									<div class="isg-digit-card__shade" aria-hidden="true"></div>
									<div class="isg-digit-card__container">
										<div class="isg-digit-card__inner">
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
