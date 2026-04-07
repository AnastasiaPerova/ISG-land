<?php
/**
 * Application section.
 *
 * @package ISG
 */

$page_id = get_the_ID();

$default_items = array(
	array(
		'icon'        => isg_asset_uri('img/icons/oil-gas.svg'),
		'title'       => 'Oil & Gas',
		'pill'        => 'API 5L',
		'image'       => isg_asset_uri('img/advantages_1.jpg'),
		'hint'        => 'Line pipe for upstream gathering, refineries, and high-pressure transmission to standard API 5L.',
		'description' => 'Transmission systems',
	),
	array(
		'icon'        => isg_asset_uri('img/icons/construction.svg'),
		'title'       => 'Construction',
		'pill'        => 'EN 10208-2',
		'image'       => isg_asset_uri('img/img-test-1.jpg'),
		'hint'        => 'Piles, casing, and structural tubulars for bridges, high-rises, and civil-engineering shells.',
		'description' => 'Structural solutions',
	),
	array(
		'icon'        => isg_asset_uri('img/icons/infrastructure.svg'),
		'title'       => 'Infrastructure',
		'pill'        => 'ISO 3183',
		'image'       => isg_asset_uri('img/img-test-2.jpg'),
		'hint'        => 'Water mains, storm drains, tunnels, and district networks that need long service life.',
		'description' => 'Utility networks',
	),
	array(
		'icon'        => isg_asset_uri('img/icons/industry.svg'),
		'title'       => 'Industry',
		'pill'        => 'EN 10208-2',
		'image'       => isg_asset_uri('img/isg-quality-content-3.jpg'),
		'hint'        => 'Process lines, cooling circuits, and plant piping where wall thickness and weld quality matter.',
		'description' => 'Process piping',
	),
	array(
		'icon'        => isg_asset_uri('img/icons/agriculture.svg'),
		'title'       => 'Agriculture',
		'pill'        => 'GOST 20295',
		'image'       => isg_asset_uri('img/about-us-intro.jpg'),
		'hint'        => 'Low-pressure conveyance for irrigation laterals, drainage, and on-farm water distribution.',
		'description' => 'Irrigation systems',
	),
);

$section = isg_acf_group(
	'application_section',
	array(
		'intro_kicker' => 'Application Areas',
		'intro_title'  => 'Spiral-welded pipes are used in various industries, such as:',
		'video_url'    => isg_asset_uri('video/test.mp4'),
		'cta_label'    => 'Download catalogue',
		'cta_url'      => '#',
		'items'        => $default_items,
	),
	$page_id
);

$intro_kicker = (string) ($section['intro_kicker'] ?? 'Application Areas');
$intro_title  = (string) ($section['intro_title'] ?? 'Spiral-welded pipes are used in various industries, such as:');
$video_url    = (string) ($section['video_url'] ?? isg_asset_uri('video/test.mp4'));
$cta_label    = (string) ($section['cta_label'] ?? 'Download catalogue');
$cta_url      = (string) ($section['cta_url'] ?? '#');
$items        = is_array($section['items'] ?? null) ? $section['items'] : $default_items;
?>
<section
	id="isg-application"
	class="isg-app isg-app--scroll"
	data-isg-block="application"
	data-isg-app-scroll
>
	<div class="isg-app__scene" hidden>
		<div class="isg-app__scene-reveal">
			<div class="isg-app__media" aria-hidden="true">
				<video
					class="isg-app__video"
					muted
					playsinline
					preload="metadata"
					src="<?php echo esc_url($video_url); ?>"
				></video>
				<div class="isg-app__media-shade"></div>
			</div>

			<div class="isg-app__inner">
				<div class="isg-app-scroll__overlap">
					<div class="isg-app-scroll__rows">
						<div class="isg-app-scroll__stage">
							<div class="isg-title-group isg-app-scroll__stage-intro">
								<div class="isg-subtitle">
									<p class="isg-subtitle__text"><?php echo esc_html($intro_kicker); ?></p>
									<span class="isg-subtitle__swatch" aria-hidden="true"></span>
								</div>
								<h2 class="isg-display isg-text-center" aria-label="<?php echo esc_attr(wp_strip_all_tags($intro_title)); ?>">
									<?php echo esc_html($intro_title); ?>
								</h2>
							</div>

							<div class="isg-app-scroll__stage-body">
								<div class="isg-app-row">
									<div class="isg-app-left">
										<div class="isg-accordion isg-accordion--app-scroll">
											<?php foreach ($items as $item) : ?>
												<?php
												$icon_url    = isg_image_url($item['icon'] ?? '', isg_asset_uri('img/icons/industry.svg'));
												$item_title  = (string) ($item['title'] ?? '');
												$item_pill   = (string) ($item['pill'] ?? '');
												$image_url   = isg_image_url($item['image'] ?? '', isg_asset_uri('img/advantages_1.jpg'));
												$image_alt   = isg_image_alt($item['image'] ?? '', '');
												$item_hint   = (string) ($item['hint'] ?? '');
												$item_desc   = (string) ($item['description'] ?? '');
												?>
												<div class="isg-accordion__item">
													<button type="button" class="isg-accordion__trigger" aria-expanded="false">
														<span class="isg-accordion__tab-content">
															<span class="isg-accordion__title-group">
																<span class="isg-accordion__icon" aria-hidden="true"><img src="<?php echo esc_url($icon_url); ?>" alt="" width="32" height="32" decoding="async" /></span>
																<span class="isg-accordion__title"><?php echo esc_html($item_title); ?></span>
															</span>
															<span class="isg-pill isg-pill--on-dark"><?php echo esc_html($item_pill); ?></span>
														</span>
													</button>
													<div class="isg-accordion__body">
														<div class="isg-accordion__body-inner">
															<div class="isg-accordion__media">
																<img
																	class="isg-accordion__img"
																	src="<?php echo esc_url($image_url); ?>"
																	alt="<?php echo esc_attr($image_alt); ?>"
																	loading="lazy"
																	decoding="async"
																/>
																<p class="isg-accordion__hint isg-accordion__hint--on-media"><?php echo esc_html($item_hint); ?></p>
															</div>
															<p class="isg-accordion__desc"><?php echo esc_html($item_desc); ?></p>
														</div>
													</div>
												</div>
											<?php endforeach; ?>
										</div>
									</div>
									<div class="isg-app-right">
										<div class="isg-btn-group isg-btn-group--spread isg-app-right__actions">
											<div class="isg-btn-group">
												<span class="isg-btn__media" aria-hidden="true">
													<svg class="isg-btn__media-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
														<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
													</svg>
												</span>
												<a class="isg-btn" href="<?php echo esc_url($cta_url); ?>"><?php echo esc_html($cta_label); ?></a>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div class="isg-app-scroll__head" aria-live="polite">
						<div class="isg-title-group">
							<div class="isg-subtitle">
								<p class="isg-subtitle__text"><?php echo esc_html($intro_kicker); ?></p>
								<span class="isg-subtitle__swatch" aria-hidden="true"></span>
							</div>
							<h2 class="isg-display isg-text-center isg-app-scroll__title" aria-label="<?php echo esc_attr(wp_strip_all_tags($intro_title)); ?>">
								<?php echo esc_html($intro_title); ?>
							</h2>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div class="isg-app__post" aria-hidden="true"></div>
</section>
