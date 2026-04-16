<?php
/**
 * About section.
 *
 * @package ISG
 */

$page_id = get_the_ID();

$default_values_items = array(
	array(
		'title' => 'Digital coordination',
		'image' => isg_asset_uri('img/isg-quality-content-1.jpg'),
		'icon'  => isg_asset_uri('img/icons/agriculture.svg'),
		'body'  => 'Digital coordination ties planning, production, and quality data into one clear workflow so teams respond faster and every stage stays traceable.',
	),
	array(
		'title' => 'Practical efficiency',
		'image' => isg_asset_uri('img/isg-quality-content-2.jpg'),
		'icon'  => isg_asset_uri('img/icons/construction.svg'),
		'body'  => 'Practical efficiency means lean routines on the shop floor: less waste, predictable throughput, and consistent output without compromising safety or compliance.',
	),
	array(
		'title' => 'Modern manufacturing',
		'image' => isg_asset_uri('img/isg-quality-content-3.jpg'),
		'icon'  => isg_asset_uri('img/icons/industry.svg'),
		'body'  => 'Modern manufacturing combines advanced equipment with disciplined processes delivering large-diameter pipe that meets strict specs and partner expectations.',
	),
	array(
		'title' => 'Sustainable growth',
		'image' => isg_asset_uri('img/isg-quality-content-4.jpg'),
		'icon'  => isg_asset_uri('img/icons/agriculture.svg'),
		'body'  => 'Sustainable growth drives long-term value through responsible sourcing, energy-efficient production, and partnerships built on transparency and mutual benefit.',
	),
);

$default_team_slides = array(
	array('image' => isg_asset_uri('img/isg-quality-content-1.jpg'), 'name' => 'Oleksandr Bryk', 'role' => 'CEO'),
	array('image' => isg_asset_uri('img/isg-quality-content-2.jpg'), 'name' => 'Andrzej Kowalski', 'role' => 'COO'),
	array('image' => isg_asset_uri('img/isg-quality-content-3.jpg'), 'name' => 'Dmytro Melnyk', 'role' => 'CTO'),
	array('image' => isg_asset_uri('img/isg-quality-content-4.jpg'), 'name' => 'Piotr Nowak', 'role' => 'Head of Production'),
	array('image' => isg_asset_uri('img/isg-quality-content-5.jpg'), 'name' => 'Maria Kravchenko', 'role' => 'Quality Director'),
	array('image' => isg_asset_uri('img/advantages_1.jpg'), 'name' => 'Jan Wisniewski', 'role' => 'Sales Director'),
);

$default_cert_badges = array(
	array('label' => 'ISO 9001', 'image' => ''),
	array('label' => 'ISO 14001', 'image' => ''),
	array('label' => 'CE', 'image' => ''),
	array('label' => 'API', 'image' => ''),
	array('label' => 'EN 10219', 'image' => ''),
);

$default_gallery_slides = array(
	array('image' => isg_asset_uri('img/advantages_1.jpg')),
	array('image' => isg_asset_uri('img/product-range-intro.jpg')),
	array('image' => isg_asset_uri('img/guality-control-intro.jpg')),
	array('image' => isg_asset_uri('img/isg-quality-content-1.jpg')),
	array('image' => isg_asset_uri('img/isg-quality-content-2.jpg')),
	array('image' => isg_asset_uri('img/isg-quality-content-3.jpg')),
);

$section = isg_acf_group(
	'about_section',
	array(
		'intro_background'   => isg_asset_uri('img/about-us-intro.jpg'),
		'intro_kicker'       => 'PRODUCT RANGE',
		'intro_title'        => 'ISG modern spiral-welded pipe production with reliable quality and competitive service',
		'textgrid_kicker'    => 'our position',
		'textgrid_left'      => 'We believe that sustainable growth is based on fair competition, technical reliability, and trusted partnerships. ISG is focused on becoming one of Europe leading suppliers of large-diameter electric-welded pipes. Our strategy includes the expansion of production capacity, continuous quality improvement, and a stronger presence across European markets.',
		'textgrid_heading'   => 'ISG Industrial Steel Group is a Polish company that launched a new, modern production of large-diameter spiral-welded pipes in 2024',
		'textgrid_lead'      => 'ISG Industrial Steel Group provides maximum advantage to partners by offering quality pipe products in the metallurgical industry and convenient service at a competitive price.',
		'values_kicker'      => 'PRODUCT RANGE',
		'values_skip_label'  => 'Skip',
		'values_items'       => $default_values_items,
		'team_kicker'        => 'our position',
		'team_heading'       => 'Our team comprises seasoned professionals with extensive experience in steel pipe manufacturing and distribution',
		'team_lead'          => 'With a deep understanding of industry intricacies and cutting-edge technologies, our experts deliver uncompromising quality and reliability for your projects',
		'certs_lead'         => 'Typical steel grades include:',
		'team_slides'        => $default_team_slides,
		'cert_badges'        => $default_cert_badges,
		'gallery_kicker'     => 'Gallery',
		'gallery_heading'    => 'Our team comprises seasoned professionals with extensive experience in steel pipe manufacturing and distribution',
		'gallery_slides'     => $default_gallery_slides,
	),
	$page_id
);

$intro_bg        = isg_image_url($section['intro_background'] ?? '', isg_asset_uri('img/about-us-intro.jpg'));
$intro_kicker    = (string) ($section['intro_kicker'] ?? 'PRODUCT RANGE');
$intro_title     = (string) ($section['intro_title'] ?? '');
$text_kicker     = (string) ($section['textgrid_kicker'] ?? 'our position');
$text_left       = (string) ($section['textgrid_left'] ?? '');
$text_heading    = (string) ($section['textgrid_heading'] ?? '');
$text_lead       = (string) ($section['textgrid_lead'] ?? '');
$values_kicker   = (string) ($section['values_kicker'] ?? 'PRODUCT RANGE');
$values_skip     = (string) ($section['values_skip_label'] ?? 'Skip');
$values_items    = is_array($section['values_items'] ?? null) ? $section['values_items'] : $default_values_items;
$team_kicker     = (string) ($section['team_kicker'] ?? 'our position');
$team_heading    = (string) ($section['team_heading'] ?? '');
$team_lead       = (string) ($section['team_lead'] ?? '');
$certs_lead      = (string) ($section['certs_lead'] ?? '');
$team_slides     = is_array($section['team_slides'] ?? null) ? $section['team_slides'] : $default_team_slides;
$cert_badges     = is_array($section['cert_badges'] ?? null) ? $section['cert_badges'] : $default_cert_badges;
$gallery_kicker  = (string) ($section['gallery_kicker'] ?? 'Gallery');
$gallery_heading = (string) ($section['gallery_heading'] ?? '');
$gallery_slides  = is_array($section['gallery_slides'] ?? null) ? $section['gallery_slides'] : $default_gallery_slides;

$normalize_wrap_text = static function ($value) {
	$value = preg_replace('/[\x{00A0}\x{2007}\x{202F}]+/u', ' ', (string) $value);
	$value = preg_replace('/[\x{2010}\x{2011}\x{00AD}]+/u', '-', $value);

	return is_string($value) ? $value : '';
};

$text_heading = $normalize_wrap_text($text_heading);
$text_lead    = $normalize_wrap_text($text_lead);
?>
<div class="isg-intro-pin isg-intro-pin--about">
	<section class="isg-intro-section isg-intro-section--align-center isg-about-intro" style="background-image: url('<?php echo esc_url($intro_bg); ?>');" data-isg-intro-scroll>
		<div class="isg-intro-section__container isg-about-intro__conteiner container">
			<div class="isg-intro-section__content isg-about-intro__content">
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
</div>

<div id="isg-about" class="isg-about-intro-block isg-section-surface" data-isg-block="about">
	<div class="isg-about-main">
		<div class="container isg-about-text-grid">
			<div class="isg-about-text-grid__row isg-grid-row">
				<div class="isg-about-text-grid__left isg-grid-col isg-grid-col--left">
					<div class="isg-subtitle">
						<p class="isg-subtitle__text"><?php echo esc_html($text_kicker); ?></p>
						<span class="isg-subtitle__swatch" aria-hidden="true"></span>
					</div>
					<p class="isg-body"><?php echo esc_html($text_left); ?></p>
				</div>
				<div class="isg-about-text-grid__right isg-grid-col isg-grid-col--right">
					<h2 class="isg-h2"><?php echo esc_html($text_heading); ?></h2>
					<p class="isg-body-lg"><?php echo esc_html($text_lead); ?></p>
				</div>
			</div>
		</div>

		<div class="isg-about-content-block">
			<div class="isg-quality-content__track" data-isg-quality-scroll data-isg-quality-about aria-label="Company values">
				<div class="isg-quality-markers" aria-hidden="true">
					<?php foreach ($values_items as $i => $item) : ?>
						<span class="isg-quality-marker" data-isg-quality-marker="<?php echo esc_attr((string) $i); ?>"></span>
					<?php endforeach; ?>
				</div>
				<div class="isg-quality-content__sticky">
					<div class="container">
						<div class="isg-quality-row">
							<div class="isg-quality-list-wrap">
								<div class="isg-subtitle isg-quality-list-wrap__label">
									<p class="isg-subtitle__text"><?php echo esc_html($values_kicker); ?></p>
									<span class="isg-subtitle__swatch" aria-hidden="true"></span>
								</div>
								<div class="isg-quality-list-center">
									<ul class="isg-quality-list" data-isg-quality-list-scroll>
										<?php foreach ($values_items as $i => $item) : ?>
											<?php $title = (string) ($item['title'] ?? ''); ?>
											<li class="isg-quality-list__li<?php echo $i === 0 ? ' isg-quality-list__item--active' : ''; ?>">
												<button type="button" class="isg-quality-list-item isg-quality-label--plain isg-quality-list-item--text-only<?php echo $i === 0 ? ' isg-quality-list-item--active' : ''; ?>" data-isg-quality-index="<?php echo esc_attr((string) $i); ?>" aria-pressed="<?php echo $i === 0 ? 'true' : 'false'; ?>">
													<span class="isg-quality-list-item__text isg-quality-list-item__title"><?php echo esc_html($title); ?></span>
												</button>
											</li>
										<?php endforeach; ?>
									</ul>
								</div>
								<button type="button" class="isg-quality-list-wrap__skip" data-isg-skip-next aria-label="<?php echo esc_attr($values_skip); ?>">
									<?php echo esc_html($values_skip); ?>
								</button>
							</div>
							<div class="isg-about-feature-card">
								<div class="isg-quality-visual">
									<div class="isg-quality-visual__slides" data-isg-quality-mobile-slider>
										<?php foreach ($values_items as $i => $item) : ?>
											<?php
											$title     = (string) ($item['title'] ?? '');
											$image_url = isg_image_url($item['image'] ?? '', isg_asset_uri('img/isg-quality-content-1.jpg'));
											$image_alt = isg_image_alt($item['image'] ?? '', '');
											?>
											<div class="isg-quality-visual__slide<?php echo $i === 0 ? ' isg-quality-visual__slide--active' : ''; ?>" data-isg-quality-slide="<?php echo esc_attr((string) $i); ?>" role="img" aria-label="<?php echo esc_attr($title); ?>">
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
											<?php foreach ($values_items as $i => $item) : ?>
												<?php
												$icon = isg_image_url($item['icon'] ?? '', '');
												$body = (string) ($item['body'] ?? '');
												?>
												<div class="isg-about-feature-card__content-slide<?php echo $i === 0 ? ' isg-about-feature-card__content-slide--active' : ''; ?>" data-isg-about-content-slide="<?php echo esc_attr((string) $i); ?>">
													<?php if ($icon !== '') : ?>
														<span class="isg-about-feature-card__icon" aria-hidden="true">
															<img src="<?php echo esc_url($icon); ?>" width="40" height="40" alt="" loading="lazy" decoding="async" />
														</span>
													<?php endif; ?>
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

		<div class="isg-about-team-block">
			<div class="isg-about-team-block__inner container">
				<div class="isg-section-head isg-section-head--color-ivory isg-title-group isg-title-group--align-start">
					<div class="isg-section-head__subtitle isg-subtitle">
						<p class="isg-subtitle__text"><?php echo esc_html($team_kicker); ?></p>
						<span class="isg-subtitle__swatch" aria-hidden="true"></span>
					</div>
					<div class="isg-section-head__title-row">
						<div class="isg-section-head__title-col">
							<h2 class="isg-section-head__title isg-h2"><?php echo esc_html($team_heading); ?></h2>
						</div>
					</div>
				</div>

				<div class="isg-about-team-block__main isg-grid-row">
					<div class="isg-about-team-block__lead isg-grid-col isg-grid-col--left">
						<p class="isg-body"><?php echo esc_html($team_lead); ?></p>
					</div>
					<div class="isg-about-team-block__slider-wrap isg-grid-col isg-grid-col--right">
						<div class="isg-slider isg-slider--mode-center isg-about-team-block__slider" data-isg-slider="team">
							<div class="isg-slider__track">
								<?php foreach ($team_slides as $slide) : ?>
									<?php
									$img  = isg_image_url($slide['image'] ?? '', isg_asset_uri('img/isg-quality-content-1.jpg'));
									$name = (string) ($slide['name'] ?? '');
									$role = (string) ($slide['role'] ?? '');
									?>
									<div class="isg-slider__item">
										<div class="isg-slider-item__img" style="background-image: url('<?php echo esc_url($img); ?>');"></div>
										<div class="isg-slider-item__caption">
											<p class="isg-slider-item__name"><?php echo esc_html($name); ?></p>
											<p class="isg-slider-item__role"><?php echo esc_html($role); ?></p>
										</div>
									</div>
								<?php endforeach; ?>
							</div>
							<div class="isg-slider-nav" aria-hidden="true">
								<div class="isg-slider-nav__inner">
									<div class="isg-slider-nav__line"></div>
									<div class="isg-slider-nav__thumb"></div>
								</div>
							</div>
							<button type="button" class="isg-slider__btn isg-slider__btn--prev" aria-label="Previous slide">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
								</svg>
							</button>
							<button type="button" class="isg-slider__btn isg-slider__btn--next" aria-label="Next slide">
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
									<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
								</svg>
							</button>
						</div>
					</div>
				</div>

				<div id="isg-certificates" class="isg-about-team-block__certs isg-grid-row isg-product-content__row--divider">
					<div class="isg-about-team-block__certs-lead isg-grid-col isg-grid-col--left">
						<p class="isg-body"><?php echo esc_html($certs_lead); ?></p>
					</div>
					<div class="isg-about-team-block__certs-list isg-grid-col isg-grid-col--right">
						<div class="isg-filled-items isg-filled-items--wide isg-about-certs">
							<?php foreach ($cert_badges as $badge) : ?>
								<?php
								$label = (string) ($badge['label'] ?? '');
								$image = isg_image_url($badge['image'] ?? '', '');
								$is_clickable = $image !== '';
								?>
								<button
									type="button"
									class="isg-filled-item isg-filled-item--about"
									<?php if ($is_clickable) : ?>
										data-isg-lightbox="<?php echo esc_attr($image); ?>"
										aria-label="<?php echo esc_attr('View certificate: ' . $label); ?>"
									<?php else : ?>
										disabled
										aria-label="<?php echo esc_attr($label); ?>"
									<?php endif; ?>
								>
									<span class="isg-filled-item__text"><?php echo esc_html($label); ?></span>
									<span class="isg-filled-item__go" aria-hidden="true">
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
											<path d="M12 5C6 5 2 12 2 12C2 12 6 19 12 19C18 19 22 12 22 12C22 12 18 5 12 5Z" stroke="#1257A6" stroke-width="2"/>
											<path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="#1257A6" stroke-width="2"/>
										</svg>
									</span>
								</button>
							<?php endforeach; ?>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<section class="isg-about-gallery-block isg-section-surface" data-isg-block="about-gallery">
	<div class="container">
		<div class="isg-section-head isg-section-head--color-white isg-title-group isg-title-group--align-start">
			<div class="isg-section-head__subtitle isg-subtitle">
				<p class="isg-subtitle__text"><?php echo esc_html($gallery_kicker); ?></p>
				<span class="isg-subtitle__swatch" aria-hidden="true"></span>
			</div>
			<div class="isg-section-head__title-row">
				<div class="isg-section-head__title-col">
					<h2 class="isg-section-head__title isg-h2"><?php echo esc_html($gallery_heading); ?></h2>
				</div>
			</div>
		</div>
	</div>
	<div class="isg-about-gallery-block__slider-bleed">
		<div class="isg-slider isg-slider--gallery" data-isg-slider="gallery">
			<div class="isg-slider__track">
				<?php foreach ($gallery_slides as $slide) : ?>
					<?php $image = isg_image_url($slide['image'] ?? '', isg_asset_uri('img/advantages_1.jpg')); ?>
					<div class="isg-slider__item isg-slider__item--wide">
						<button type="button" class="isg-slider-item__img isg-slider-item__img--lightbox" style="background-image: url('<?php echo esc_url($image); ?>');" data-isg-lightbox="<?php echo esc_attr($image); ?>" aria-label="Open gallery image"></button>
					</div>
				<?php endforeach; ?>
			</div>
			<div class="isg-slider-nav" aria-hidden="true">
				<div class="isg-slider-nav__inner">
					<div class="isg-slider-nav__line"></div>
					<div class="isg-slider-nav__thumb"></div>
				</div>
			</div>
			<button type="button" class="isg-slider__btn isg-slider__btn--prev" aria-label="Previous slide">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M15 6l-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				</svg>
			</button>
			<button type="button" class="isg-slider__btn isg-slider__btn--next" aria-label="Next slide">
				<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
					<path d="M9 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				</svg>
			</button>
		</div>
	</div>
</section>
