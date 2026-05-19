<?php
/**
 * Quality section.
 *
 * @package ISG
 */

$page_id = get_the_ID();

$default_items = array(
	array(
		'title' => 'Dimensional inspection',
		'image' => isg_asset_uri('img/isg-quality-content-1.jpg'),
		'icon'  => isg_asset_uri('img/icons/infrastructure.svg'),
		'body'  => 'Every pipe undergoes precise dimensional checks diameter, wall thickness, length, and ovality ensuring full compliance with project specifications.',
	),
	array(
		'title' => 'Traceability',
		'image' => isg_asset_uri('img/isg-quality-content-2.jpg'),
		'icon'  => isg_asset_uri('img/icons/industry.svg'),
		'body'  => 'Each pipe is assigned a unique identification code, linking it to raw material certificates, production data, and test results throughout its lifecycle.',
	),
	array(
		'title' => 'Laboratory testing',
		'image' => isg_asset_uri('img/isg-quality-content-3.jpg'),
		'icon'  => isg_asset_uri('img/icons/construction.svg'),
		'body'  => 'In-house laboratory performs mechanical, chemical, and metallographic testing to verify material properties meet the required standards.',
	),
	array(
		'title' => 'Documentation',
		'image' => isg_asset_uri('img/isg-quality-content-4.jpg'),
		'icon'  => isg_asset_uri('img/icons/oil-gas.svg'),
		'body'  => 'Comprehensive quality documentation mill certificates, inspection reports, and compliance records accompanies every delivery.',
	),
	array(
		'title' => 'Third-party inspection',
		'image' => isg_asset_uri('img/isg-quality-content-5.jpg'),
		'icon'  => isg_asset_uri('img/icons/agriculture.svg'),
		'body'  => 'Independent inspectors verify production quality on-site, providing additional assurance for critical infrastructure projects.',
	),
);

$section = isg_acf_group(
	'quality_section',
	array(
		'intro_background'        => isg_asset_uri('img/guality-control-intro.jpg'),
		'intro_mobile_background' => '',
		'intro_overlay_enabled'   => true,
		'intro_overlay_color_start' => '#000000',
		'intro_overlay_color_mid' => '#000000',
		'intro_overlay_color_end' => '#000000',
		'intro_kicker'            => 'PRODUCT RANGE',
		'intro_title'             => 'Quality control is an essential part of the production process',
		'focus_kicker'            => 'Focus areas',
		'focus_heading'           => 'Quality control focus areas cover every stage from production to final delivery',
		'skip_label'              => 'Skip',
		'items'                   => $default_items,
	),
	$page_id
);

$intro_bg        = isg_image_url($section['intro_background'] ?? '', isg_asset_uri('img/guality-control-intro.jpg'));
$intro_mobile_bg = isg_image_url($section['intro_mobile_background'] ?? '', '');
$intro_bg_size   = isg_image_dimensions($section['intro_background'] ?? '', 1920, 1140);
$intro_overlay   = !array_key_exists('intro_overlay_enabled', $section) || (bool) $section['intro_overlay_enabled'];
$intro_overlay_style = sprintf(
	'--isg-intro-overlay-start:%s;--isg-intro-overlay-mid:%s;--isg-intro-overlay-end:%s;',
	isg_color_to_rgba($section['intro_overlay_color_start'] ?? '#000000', 0.62),
	isg_color_to_rgba($section['intro_overlay_color_mid'] ?? '#000000', 0.46),
	isg_color_to_rgba($section['intro_overlay_color_end'] ?? '#000000', 0.68)
);
$intro_kicker    = (string) ($section['intro_kicker'] ?? 'PRODUCT RANGE');
$intro_title     = (string) ($section['intro_title'] ?? 'Quality control is an essential part of the production process');
$focus_kicker    = (string) ($section['focus_kicker'] ?? 'Focus areas');
$focus_heading = (string) ($section['focus_heading'] ?? 'Quality control focus areas cover every stage from production to final delivery');
$items        = is_array($section['items'] ?? null) ? $section['items'] : $default_items;
$items        = array_slice($items, 0, 4);

$intro_classes = array('isg-intro-section', 'isg-intro-section--align-center', 'isg-quality-intro');
if ($intro_overlay) {
	$intro_classes[] = 'isg-intro-section--dark-overlay';
}
?>
<div id="isg-quality" class="isg-quality-section" data-isg-block="quality">
	<section class="<?php echo esc_attr(implode(' ', $intro_classes)); ?>" style="<?php echo esc_attr($intro_overlay_style); ?>" data-isg-intro-scroll>
		<div class="isg-intro-media" aria-hidden="true">
			<div class="isg-intro-media__inner">
				<picture>
					<?php if ($intro_mobile_bg !== '') : ?>
						<source media="(max-width: 1099px)" srcset="<?php echo esc_url($intro_mobile_bg); ?>" />
					<?php endif; ?>
					<img class="isg-intro-media__img" src="<?php echo esc_url($intro_bg); ?>" alt="" width="<?php echo esc_attr((string) $intro_bg_size['width']); ?>" height="<?php echo esc_attr((string) $intro_bg_size['height']); ?>" loading="lazy" decoding="async" />
				</picture>
			</div>
		</div>
		<div class="isg-intro-section__container isg-quality-intro__conteiner container">
			<div class="isg-intro-section__content isg-quality-intro__content">
				<div class="isg-title-group">
					<div class="isg-subtitle">
						<p class="isg-subtitle__text"><?php echo esc_html($intro_kicker); ?></p>
						<span class="isg-subtitle__swatch" aria-hidden="true"></span>
					</div>
					<h2 class="isg-display isg-text-center"><?php echo esc_html($intro_title); ?></h2>
				</div>
			</div>
		</div>
	</section>
	<div class="isg-quality-wrapper isg-section-surface">
		<div class="isg-quality-content container">
			<div class="isg-section-head isg-section-head--color-white isg-title-group isg-title-group--align-start isg-quality-cards-head">
				<div class="isg-section-head__subtitle isg-subtitle">
					<p class="isg-subtitle__text"><?php echo esc_html($focus_kicker); ?></p>
					<span class="isg-subtitle__swatch" aria-hidden="true"></span>
				</div>
				<div class="isg-section-head__title-row">
					<div class="isg-section-head__title-col">
						<h2 class="isg-section-head__title isg-h2"><?php echo esc_html($focus_heading); ?></h2>
					</div>
				</div>
			</div>
			<div class="isg-quality-cards" aria-label="Quality control focus areas">
				<?php foreach ($items as $item) : ?>
					<?php
					$title     = (string) ($item['title'] ?? '');
					$body      = (string) ($item['body'] ?? '');
					$image_url = isg_image_url($item['image'] ?? '', isg_asset_uri('img/isg-quality-content-1.jpg'));
					$image_alt = isg_image_alt($item['image'] ?? '', '');
					$image_size = isg_image_dimensions($item['image'] ?? '', 884, 824);
					$icon_url  = isg_image_url($item['icon'] ?? '', '');
					$icon_alt  = isg_image_alt($item['icon'] ?? '', '');
					$icon_size = isg_image_dimensions($item['icon'] ?? '', 32, 32);
					?>
					<article class="isg-quality-card">
						<img class="isg-quality-card__img" src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($image_alt); ?>" width="<?php echo esc_attr((string) $image_size['width']); ?>" height="<?php echo esc_attr((string) $image_size['height']); ?>" loading="lazy" decoding="async" />
						<div class="isg-quality-card__content">
							<?php if ($icon_url !== '') : ?>
								<span class="isg-quality-card__icon">
									<img src="<?php echo esc_url($icon_url); ?>" alt="<?php echo esc_attr($icon_alt); ?>" width="<?php echo esc_attr((string) $icon_size['width']); ?>" height="<?php echo esc_attr((string) $icon_size['height']); ?>" loading="lazy" decoding="async" />
								</span>
							<?php endif; ?>
							<h3 class="isg-quality-card__title"><?php echo esc_html($title); ?></h3>
							<p class="isg-quality-card__text"><?php echo esc_html($body); ?></p>
						</div>
					</article>
				<?php endforeach; ?>
			</div>
		</div>
	</div>
</div>
