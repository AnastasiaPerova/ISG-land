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
		'intro_background' => isg_asset_uri('img/guality-control-intro.jpg'),
		'intro_kicker'     => 'PRODUCT RANGE',
		'intro_title'      => 'Quality control is an essential part of the production process',
		'focus_kicker'     => 'Focus areas',
		'skip_label'       => 'Skip',
		'items'            => $default_items,
	),
	$page_id
);

$intro_bg     = isg_image_url($section['intro_background'] ?? '', isg_asset_uri('img/guality-control-intro.jpg'));
$intro_kicker = (string) ($section['intro_kicker'] ?? 'PRODUCT RANGE');
$intro_title  = (string) ($section['intro_title'] ?? 'Quality control is an essential part of the production process');
$focus_kicker = (string) ($section['focus_kicker'] ?? 'Focus areas');
$skip_label   = (string) ($section['skip_label'] ?? 'Skip');
$items        = is_array($section['items'] ?? null) ? $section['items'] : $default_items;
?>
<div id="isg-quality" class="isg-quality-section" data-isg-block="quality">
	<section class="isg-intro-section isg-intro-section--align-center isg-quality-intro" style="background-image: url('<?php echo esc_url($intro_bg); ?>');"
		data-isg-intro-scroll>
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
		<div class="isg-quality-content">
			<div class="isg-quality-content__track" data-isg-quality-scroll data-isg-quality-about
				aria-label="Quality control focus areas">
				<div class="isg-quality-markers" aria-hidden="true">
					<?php foreach ($items as $i => $item) : ?>
						<span class="isg-quality-marker" data-isg-quality-marker="<?php echo esc_attr((string) $i); ?>"></span>
					<?php endforeach; ?>
				</div>
				<div class="isg-quality-content__sticky">
					<div class="container">
						<div class="isg-quality-row">
							<div class="isg-quality-list-wrap">
								<div class="isg-subtitle isg-quality-list-wrap__label">
									<p class="isg-subtitle__text"><?php echo esc_html($focus_kicker); ?></p>
									<span class="isg-subtitle__swatch" aria-hidden="true"></span>
								</div>
								<div class="isg-quality-list-center">
									<ul class="isg-quality-list" data-isg-quality-list-scroll>
										<?php foreach ($items as $i => $item) : ?>
											<?php $title = (string) ($item['title'] ?? ''); ?>
											<li class="isg-quality-list__li<?php echo $i === 0 ? ' isg-quality-list__item--active' : ''; ?>">
												<button
													type="button"
													class="isg-quality-list-item isg-quality-label--plain isg-quality-list-item--text-only<?php echo $i === 0 ? ' isg-quality-list-item--active' : ''; ?>"
													data-isg-quality-index="<?php echo esc_attr((string) $i); ?>"
													aria-pressed="<?php echo $i === 0 ? 'true' : 'false'; ?>"
												>
													<span class="isg-quality-list-item__text isg-quality-list-item__title"><?php echo esc_html($title); ?></span>
												</button>
											</li>
										<?php endforeach; ?>
									</ul>
								</div>
								<button type="button" class="isg-quality-list-wrap__skip" data-isg-skip-next
									aria-label="<?php echo esc_attr($skip_label); ?>">
									<?php echo esc_html($skip_label); ?>
								</button>
							</div>
							<div class="isg-about-feature-card">
								<div class="isg-quality-visual">
									<div class="isg-quality-visual__slides" data-isg-quality-mobile-slider>
										<?php foreach ($items as $i => $item) : ?>
											<?php
											$title     = (string) ($item['title'] ?? '');
											$image_url = isg_image_url($item['image'] ?? '', isg_asset_uri('img/isg-quality-content-1.jpg'));
											$image_alt = isg_image_alt($item['image'] ?? '', '');
											?>
											<div class="isg-quality-visual__slide<?php echo $i === 0 ? ' isg-quality-visual__slide--active' : ''; ?>" data-isg-quality-slide="<?php echo esc_attr((string) $i); ?>"
												role="img" aria-label="<?php echo esc_attr($title); ?>">
												<img class="isg-quality-visual__slide-img" src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($image_alt); ?>" loading="lazy" decoding="async" />
												<div class="isg-quality-visual__caption">
													<h3 class="isg-quality-visual__caption-title"><?php echo esc_html($title); ?></h3>
												</div>
											</div>
										<?php endforeach; ?>
									</div>
								</div>
								<div class="isg-about-feature-card__inner">
									<div class="isg-about-feature-card__content-stack">
										<div class="isg-about-feature-card__content-inner">
											<?php foreach ($items as $i => $item) : ?>
												<?php
												$icon_url = isg_image_url($item['icon'] ?? '', isg_asset_uri('img/icons/infrastructure.svg'));
												$body     = (string) ($item['body'] ?? '');
												?>
												<div class="isg-about-feature-card__content-slide<?php echo $i === 0 ? ' isg-about-feature-card__content-slide--active' : ''; ?>"
													data-isg-about-content-slide="<?php echo esc_attr((string) $i); ?>">
													<span class="isg-about-feature-card__icon" aria-hidden="true">
														<img src="<?php echo esc_url($icon_url); ?>" width="40" height="40" alt="" loading="lazy" decoding="async" />
													</span>
													<p class="isg-body isg-about-feature-card__text"><?php echo esc_html($body); ?></p>
												</div>
											<?php endforeach; ?>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
