<?php
/**
 * Application section.
 *
 * @package ISG
 */

$page_id = get_the_ID();

$default_items = array(
	array(
		'icon' => isg_asset_uri('img/icons/oil-gas.svg'),
		'title' => 'Oil & Gas',
		'image' => isg_asset_uri('img/advantages_1.jpg'),
		'hint' => 'Line pipe for upstream gathering, refineries, and high-pressure transmission to standard API 5L.',
		'description' => 'Transmission systems',
	),
	array(
		'icon' => isg_asset_uri('img/icons/construction.svg'),
		'title' => 'Construction',
		'image' => isg_asset_uri('img/img-test-1.jpg'),
		'hint' => 'Piles, casing, and structural tubulars for bridges, high-rises, and civil-engineering shells.',
		'description' => 'Structural solutions',
	),
	array(
		'icon' => isg_asset_uri('img/icons/infrastructure.svg'),
		'title' => 'Infrastructure',
		'image' => isg_asset_uri('img/img-test-2.jpg'),
		'hint' => 'Water mains, storm drains, tunnels, and district networks that need long service life.',
		'description' => 'Utility networks',
	),
	array(
		'icon' => isg_asset_uri('img/icons/industry.svg'),
		'title' => 'Industry',
		'image' => isg_asset_uri('img/isg-quality-content-3.jpg'),
		'hint' => 'Process lines, cooling circuits, and plant piping where wall thickness and weld quality matter.',
		'description' => 'Process piping',
	),
	array(
		'icon' => isg_asset_uri('img/icons/agriculture.svg'),
		'title' => 'Agriculture',
		'image' => isg_asset_uri('img/about-us-intro.jpg'),
		'hint' => 'Low-pressure conveyance for irrigation laterals, drainage, and on-farm water distribution.',
		'description' => 'Irrigation systems',
	),
);

$section_defaults = array(
	'intro_kicker' => 'Application Areas',
	'intro_title' => 'Spiral-welded pipes are used in various industries, such as:',
	'final_heading' => 'Application areas for large-diameter spiral-welded pipes',
	'video_file' => '',
	'video_url' => isg_asset_uri('video/test.mp4'),
	'video_poster' => '',
	'mobile_bg_image' => isg_asset_uri('img/advantages_1.jpg'),
	'items' => $default_items,
);

$section = array_replace(
	$section_defaults,
	isg_acf_group('application_section', $section_defaults, $page_id)
);

$is_empty_media_value = static function ($value): bool {
	if (is_array($value)) {
		return empty($value['url']) && empty($value['ID']) && empty($value['id']);
	}
	if (is_numeric($value)) {
		return (int) $value <= 0;
	}
	return trim((string) $value) === '';
};

if (function_exists('pll_default_language') && function_exists('pll_get_post')) {
	$default_lang = (string) pll_default_language('slug');
	$default_page_id = $default_lang !== '' ? (int) pll_get_post((int) $page_id, $default_lang) : 0;
	if ($default_page_id > 0 && $default_page_id !== (int) $page_id) {
		$default_section = isg_acf_group('application_section', array(), $default_page_id);
		foreach (array('video_file', 'video_url', 'video_poster', 'mobile_bg_image') as $media_key) {
			if (
				array_key_exists($media_key, $default_section)
				&& $is_empty_media_value($section[$media_key] ?? '')
				&& !$is_empty_media_value($default_section[$media_key])
			) {
				$section[$media_key] = $default_section[$media_key];
			}
		}
	}
}

$intro_kicker = (string) ($section['intro_kicker'] ?? 'Application Areas');
$intro_title = (string) ($section['intro_title'] ?? 'Spiral-welded pipes are used in various industries, such as:');
$final_heading = (string) ($section['final_heading'] ?? 'Application areas for large-diameter spiral-welded pipes');
$video_file = $section['video_file'] ?? '';
$video_url = (string) ($section['video_url'] ?? '');
$video_poster = isg_image_url($section['video_poster'] ?? '', '');
$mobile_bg = isg_image_url($section['mobile_bg_image'] ?? '', isg_asset_uri('img/advantages_1.jpg'));
$items = is_array($section['items'] ?? null) ? $section['items'] : $default_items;

// Для WP/ACF поддерживаем оба варианта: video_file (file field) и video_url (url fallback).
if (is_array($video_file) && !empty($video_file['url']) && is_string($video_file['url'])) {
	$video_url = $video_file['url'];
} elseif (is_numeric($video_file)) {
	$video_file_url = wp_get_attachment_url((int) $video_file);
	if (is_string($video_file_url) && $video_file_url !== '') {
		$video_url = $video_file_url;
	}
}

if ($video_url === '') {
	$video_url = isg_asset_uri('video/test.mp4');
}

$video_url = isg_absolute_url($video_url, isg_asset_uri('video/test.mp4'));
?>
<section id="isg-application" class="isg-app isg-app--scroll" data-isg-block="application" data-isg-app-scroll
	data-isg-mobile-bg="<?php echo esc_url($mobile_bg); ?>">
	<div class="isg-app__scene">
		<div class="isg-app__scene-reveal">
			<div class="isg-app__media" aria-hidden="true">
				<video class="isg-app__video" muted playsinline webkit-playsinline preload="auto" width="1920" height="1080" <?php if (!empty($video_poster)): ?>
						poster="<?php echo esc_url($video_poster); ?>" <?php endif; ?>>
					<source src="<?php echo esc_url($video_url); ?>" type="video/mp4" />
				</video>
			</div>

			<div class="isg-app__inner container">
				<div class="isg-app-scroll__overlap">
					<div class="isg-app-scroll__rows">
						<div class="isg-app-scroll__stage">
							<div class="isg-title-group isg-app-scroll__stage-intro">
								<?php if (!empty($intro_kicker)): ?>
									<div class="isg-subtitle">
										<p class="isg-subtitle__text"><?php echo esc_html($intro_kicker); ?></p>
										<span class="isg-subtitle__swatch" aria-hidden="true"></span>
									</div>
								<?php endif; ?>
								<?php if (!empty($intro_title)): ?>
									<h2 class="isg-display isg-text-center"
										aria-label="<?php echo esc_attr(wp_strip_all_tags($intro_title)); ?>">
										<?php echo esc_html($intro_title); ?>
									</h2>
								<?php endif; ?>
							</div>

							<div class="isg-app-scroll__stage-body">
								<div class="isg-app-row">
									<div class="isg-app-left">
										<?php if (!empty($final_heading)): ?>
											<h3 class="isg-app-final-title"><?php echo esc_html($final_heading); ?></h3>
										<?php endif; ?>
									</div>
									<div class="isg-app-right">
										<div class="isg-accordion isg-accordion--app-scroll">
											<?php foreach ($items as $item): ?>
												<?php
												$icon_url = isg_image_url($item['icon'] ?? '', '');
												$item_title = (string) ($item['title'] ?? '');
												$image_url = isg_image_url($item['image'] ?? '', isg_asset_uri('img/advantages_1.jpg'));
												$image_alt = isg_image_alt($item['image'] ?? '', '');
												$image_size = isg_image_dimensions($item['image'] ?? '', 640, 320);
												$item_hint = (string) ($item['hint'] ?? '');
												$item_desc = (string) ($item['description'] ?? '');
												?>
												<div class="isg-accordion__item">
													<button type="button" class="isg-accordion__trigger"
														aria-expanded="false">
														<span class="isg-accordion__tab-content">
															<span class="isg-accordion__title-group">
																<?php if ($icon_url !== ''): ?>
																	<span class="isg-accordion__icon" aria-hidden="true"><img
																			src="<?php echo esc_url($icon_url); ?>" alt=""
																			width="32" height="32" decoding="async" /></span>
																<?php endif; ?>
																<span
																	class="isg-accordion__title"><?php echo esc_html($item_title); ?></span>
															</span>
														</span>
													</button>
													<div class="isg-accordion__body">
														<div class="isg-accordion__body-inner">
															<div class="isg-accordion__media">
																<img class="isg-accordion__img"
																	src="<?php echo esc_url($image_url); ?>"
																	alt="<?php echo esc_attr($image_alt); ?>"
																	width="<?php echo esc_attr((string) $image_size['width']); ?>"
																	height="<?php echo esc_attr((string) $image_size['height']); ?>" loading="eager"
																	decoding="async" />
																<?php if (!empty($item_hint)): ?>
																	<p
																		class="isg-accordion__hint isg-accordion__hint--on-media">
																		<?php echo esc_html($item_hint); ?>
																	</p>
																<?php endif; ?>
																<?php if (!empty($item_desc)): ?>
																	<p class="isg-accordion__desc isg-accordion__desc--on-media">
																		<?php echo esc_html($item_desc); ?>
																	</p>
																<?php endif; ?>
															</div>
													</div>
												</div>
												</div>
											<?php endforeach; ?>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="isg-app-scroll__head" aria-live="polite">
						<div class="isg-title-group">
							<?php if (!empty($intro_kicker)): ?>
								<div class="isg-subtitle">
									<p class="isg-subtitle__text"><?php echo esc_html($intro_kicker); ?></p>
									<span class="isg-subtitle__swatch" aria-hidden="true"></span>
								</div>
							<?php endif; ?>
							<?php if (!empty($intro_title)): ?>
								<h2 class="isg-display isg-text-center isg-app-scroll__title"
									aria-label="<?php echo esc_attr(wp_strip_all_tags($intro_title)); ?>">
									<?php echo esc_html($intro_title); ?>
								</h2>
							<?php endif; ?>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="isg-app__post" aria-hidden="true"></div>
</section>
