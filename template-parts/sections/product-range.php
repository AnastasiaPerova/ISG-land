<?php
/**
 * Product range section.
 *
 * @package ISG
 */

$page_id = get_the_ID();

$default_spec_cards = array(
	array('label' => 'Diameter (mm)', 'value' => '323.9 - 2235', 'meta' => '18 standard sizes'),
	array('label' => 'Wall thickness (mm)', 'value' => '5.0 - 25.4', 'meta' => 'Per standard'),
	array('label' => 'Length (m)', 'value' => '6 - 18.3', 'meta' => 'Custom on request'),
	array('label' => 'Steel grade', 'value' => 'S235-S460', 'meta' => 'Project-specific'),
);

$default_structural = array(
	array('text' => 'S235JRH'),
	array('text' => 'S275JOH'),
	array('text' => 'S355JOH'),
	array('text' => 'S460JOH'),
);

$default_pressure = array(
	array('text' => 'L245'),
	array('text' => 'L290'),
	array('text' => 'L360'),
);

$default_pipeline = array(
	array('text' => 'X42'),
	array('text' => 'X52'),
	array('text' => 'X70'),
);

$default_size_rows_left = array(
	array('left' => '323.9 - 610', 'right' => '5.0 - 12.7'),
	array('left' => '610 - 914', 'right' => '6.3 - 16.0'),
	array('left' => '914 - 1219', 'right' => '8.0 - 18.0'),
);

$default_size_rows_right = array(
	array('left' => '1219 - 1422', 'right' => '10.0 - 20.0'),
	array('left' => '1422 - 1829', 'right' => '12.0 - 22.0'),
	array('left' => '1829 - 2235', 'right' => '14.0 - 25.4'),
);

$section = isg_acf_group(
	'product_section',
	array(
		'intro_background'        => isg_asset_uri('img/product-range-intro.jpg'),
		'intro_mobile_background' => '',
		'intro_kicker'            => 'PRODUCT RANGE',
		'intro_title'             => 'We produce spiral-welded pipes in a wide range',
		'spec_cards'              => $default_spec_cards,
		'content_kicker'          => 'our position',
		'content_heading'         => 'We use high-quality steel grades in accordance with international standards and project requirements',
		'grades_intro'            => 'Typical steel grades include:',
		'structural_label'        => 'Structural:',
		'structural_items'        => $default_structural,
		'pressure_label'          => 'Pressure:',
		'pressure_items'          => $default_pressure,
		'pipeline_label'          => 'Pipeline:',
		'pipeline_items'          => $default_pipeline,
		'sizes_lead'              => 'We produce spiral-welded steel pipes in the following size range:',
		'sizes_head_left'         => 'Outside diameter (mm)',
		'sizes_head_right'        => 'Wall thickness (mm)',
		'size_rows_left'          => $default_size_rows_left,
		'size_rows_right'         => $default_size_rows_right,
	),
	$page_id
);

$intro_bg        = isg_image_url($section['intro_background'] ?? '', isg_asset_uri('img/product-range-intro.jpg'));
$intro_mobile_bg = isg_image_url($section['intro_mobile_background'] ?? '', '');
$intro_bg_size   = isg_image_dimensions($section['intro_background'] ?? '', 1920, 1080);
$intro_kicker    = (string) ($section['intro_kicker'] ?? 'PRODUCT RANGE');
$intro_title     = (string) ($section['intro_title'] ?? 'We produce spiral-welded pipes in a wide range');
$spec_cards      = is_array($section['spec_cards'] ?? null) ? $section['spec_cards'] : $default_spec_cards;
$content_kicker  = (string) ($section['content_kicker'] ?? 'our position');
$content_heading = (string) ($section['content_heading'] ?? 'We use high-quality steel grades in accordance with international standards and project requirements');
$grades_intro    = (string) ($section['grades_intro'] ?? 'Typical steel grades include:');
$structural_lbl  = (string) ($section['structural_label'] ?? 'Structural:');
$pressure_lbl    = (string) ($section['pressure_label'] ?? 'Pressure:');
$pipeline_lbl    = (string) ($section['pipeline_label'] ?? 'Pipeline:');
$structural      = is_array($section['structural_items'] ?? null) ? $section['structural_items'] : $default_structural;
$pressure        = is_array($section['pressure_items'] ?? null) ? $section['pressure_items'] : $default_pressure;
$pipeline        = is_array($section['pipeline_items'] ?? null) ? $section['pipeline_items'] : $default_pipeline;
$sizes_lead      = (string) ($section['sizes_lead'] ?? 'We produce spiral-welded steel pipes in the following size range:');
$head_left       = (string) ($section['sizes_head_left'] ?? 'Outside diameter (mm)');
$head_right      = (string) ($section['sizes_head_right'] ?? 'Wall thickness (mm)');
$spec_card_icons = array(
	isg_asset_uri('img/icons/Outer Diameter .svg'),
	isg_asset_uri('img/icons/Pipe Length.svg'),
	isg_asset_uri('img/icons/Wall Thickness.svg'),
	isg_asset_uri('img/icons/Steel Strength Grade up to.svg'),
);
$legacy_size_rows = is_array($section['size_rows'] ?? null) ? $section['size_rows'] : array();
$size_rows_left   = is_array($section['size_rows_left'] ?? null) ? $section['size_rows_left'] : array();
$size_rows_right  = is_array($section['size_rows_right'] ?? null) ? $section['size_rows_right'] : array();

if (!$size_rows_left) {
	$size_rows_left = $legacy_size_rows ? array_slice($legacy_size_rows, 0, 3) : $default_size_rows_left;
}

if (!$size_rows_right) {
	$size_rows_right = $legacy_size_rows ? array_slice($legacy_size_rows, 3) : $default_size_rows_right;
}

if (!$size_rows_right) {
	$size_rows_right = $default_size_rows_right;
}

$render_size_table = static function (array $rows, string $left_head, string $right_head): void {
	?>
	<div class="isg-size-spec" role="group" aria-label="Size range">
		<div class="isg-size-spec__head">
			<span class="isg-size-spec__colhead isg-size-tables__head"><?php echo esc_html($left_head); ?></span>
			<span class="isg-size-spec__colhead isg-size-tables__head"><?php echo esc_html($right_head); ?></span>
		</div>
		<div class="isg-size-spec__rule isg-size-spec__rule--head" aria-hidden="true">
			<span class="isg-size-spec__seg isg-product-content__line-draw"></span>
			<span class="isg-size-spec__seg isg-product-content__line-draw"></span>
		</div>
		<ul class="isg-size-spec__list">
			<?php foreach ($rows as $index => $row) : ?>
				<?php
				$left  = (string) ($row['left'] ?? '');
				$right = (string) ($row['right'] ?? '');
				?>
				<li class="isg-size-spec__item<?php echo $index === 0 ? ' isg-size-spec__item--first' : ''; ?>">
					<?php if ($index > 0) : ?>
						<span class="isg-size-spec__row-line isg-product-content__line-draw" aria-hidden="true"></span>
					<?php endif; ?>
					<div class="isg-size-spec__row">
						<span class="isg-size-spec__val"><?php echo esc_html($left); ?></span>
						<span class="isg-size-spec__val"><?php echo esc_html($right); ?></span>
					</div>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
	<?php
};
?>
<div id="isg-product" class="isg-product-section" data-isg-block="product-range">
	<section
		class="isg-intro-section isg-intro-section--align-center isg-product-intro"
		data-isg-intro-scroll
	>
		<div class="isg-intro-media isg-product-intro__media" aria-hidden="true">
			<div class="isg-intro-media__inner isg-product-intro__media-inner">
				<picture>
					<?php if ($intro_mobile_bg !== '') : ?>
						<source media="(max-width: 1099px)" srcset="<?php echo esc_url($intro_mobile_bg); ?>" />
					<?php endif; ?>
					<img
						class="isg-product-intro__image"
						src="<?php echo esc_url($intro_bg); ?>"
						alt=""
						width="<?php echo esc_attr((string) $intro_bg_size['width']); ?>"
						height="<?php echo esc_attr((string) $intro_bg_size['height']); ?>"
						loading="lazy"
						decoding="async"
					/>
				</picture>
			</div>
		</div>
		<div class="isg-intro-section__container isg-product-intro__conteiner container">
			<div class="isg-intro-section__content isg-product-intro__content">
				<div class="isg-title-group">
					<div class="isg-subtitle">
						<p class="isg-subtitle__text"><?php echo esc_html($intro_kicker); ?></p>
						<span class="isg-subtitle__swatch" aria-hidden="true"></span>
					</div>
					<h2 class="isg-display isg-text-center"><?php echo esc_html($intro_title); ?></h2>
				</div>
				<div class="isg-spec-cards">
					<?php foreach ($spec_cards as $idx => $card) : ?>
						<?php
						$label = (string) ($card['label'] ?? '');
						$value = (string) ($card['value'] ?? '');
						$meta  = (string) ($card['meta'] ?? '');
						$icon  = $spec_card_icons[$idx] ?? '';
						?>
						<article class="isg-spec-card">
							<div class="isg-spec-card__head">
								<p class="isg-spec-card__label"><?php echo esc_html($label); ?></p>
								<?php if ($icon !== '') : ?>
									<img src="<?php echo esc_url($icon); ?>" alt="" width="32" height="32" loading="lazy" decoding="async" aria-hidden="true" />
								<?php endif; ?>
							</div>
							<div>
								<p class="isg-spec-card__value"><?php echo esc_html($value); ?></p>
								<p class="isg-spec-card__meta"><?php echo esc_html($meta); ?></p>
							</div>
						</article>
					<?php endforeach; ?>
				</div>
			</div>
		</div>
	</section>
	<div class="isg-product-content isg-section-surface">
		<div class="container isg-product-content__inner">
			<div class="isg-section-head isg-section-head--color-ivory isg-title-group isg-title-group--align-start">
				<div class="isg-section-head__subtitle isg-subtitle">
					<p class="isg-subtitle__text"><?php echo esc_html($content_kicker); ?></p>
					<span class="isg-subtitle__swatch" aria-hidden="true"></span>
				</div>
				<div class="isg-section-head__title-row">
					<div class="isg-section-head__title-col">
						<h2 class="isg-section-head__title isg-h2"><?php echo esc_html($content_heading); ?></h2>
					</div>
				</div>
			</div>
			<div class="isg-product-content__row isg-grid-row isg-product-content__row--grades">
				<div class="isg-product-content__col isg-grid-col isg-grid-col--left isg-product-content__col--grades-intro">
					<p class="isg-body"><?php echo esc_html($grades_intro); ?></p>
				</div>
				<div class="isg-product-content__grades-stacks">
					<div class="isg-product-content__col isg-grid-col isg-product-content__col--grades-stack">
						<div class="isg-subtitle">
							<p class="isg-mono-label"><?php echo esc_html($structural_lbl); ?></p>
						</div>
						<div class="isg-filled-items">
							<?php foreach ($structural as $item) : ?>
								<div class="isg-filled-item"><span><?php echo esc_html((string) ($item['text'] ?? '')); ?></span></div>
							<?php endforeach; ?>
						</div>
					</div>
					<div class="isg-product-content__col isg-grid-col isg-product-content__col--grades-stack">
						<div class="isg-subtitle">
							<p class="isg-mono-label"><?php echo esc_html($pressure_lbl); ?></p>
						</div>
						<div class="isg-filled-items">
							<?php foreach ($pressure as $item) : ?>
								<div class="isg-filled-item"><span><?php echo esc_html((string) ($item['text'] ?? '')); ?></span></div>
							<?php endforeach; ?>
						</div>
					</div>
					<div class="isg-product-content__col isg-grid-col isg-product-content__col--grades-stack isg-product-content__col--grades-stack--wide">
						<div class="isg-subtitle">
							<p class="isg-mono-label"><?php echo esc_html($pipeline_lbl); ?></p>
						</div>
						<div class="isg-filled-items">
							<?php foreach ($pipeline as $item) : ?>
								<div class="isg-filled-item"><span><?php echo esc_html((string) ($item['text'] ?? '')); ?></span></div>
							<?php endforeach; ?>
						</div>
					</div>
				</div>
			</div>
			<div class="isg-product-content__row isg-grid-row isg-product-content__row--rule">
				<div class="isg-rule" role="presentation">
					<span class="isg-rule__line" aria-hidden="true"></span>
				</div>
			</div>
			<div class="isg-product-content__row isg-grid-row isg-product-content__row--sizes isg-product-content__row--sizes-desktop">
				<div class="isg-product-content__col isg-grid-col isg-grid-col--left isg-product-content__col--size-lead">
					<p class="isg-body"><?php echo esc_html($sizes_lead); ?></p>
				</div>
				<div class="isg-product-content__col isg-grid-col isg-grid-col--right isg-product-content__col--size-panel">
					<div class="isg-size-tables">
						<div class="isg-size-tables__pair">
							<?php $render_size_table($size_rows_left, $head_left, $head_right); ?>
						</div>
						<div class="isg-size-tables__pair">
							<?php $render_size_table($size_rows_right, $head_left, $head_right); ?>
						</div>
					</div>
				</div>
			</div>
			<div class="isg-product-content__row isg-grid-row isg-product-content__row--sizes isg-product-content__row--sizes-mobile">
				<div class="isg-product-content__col isg-grid-col isg-grid-col--left isg-product-content__col--size-lead">
					<p class="isg-body"><?php echo esc_html($sizes_lead); ?></p>
				</div>
				<div class="isg-product-content__col isg-grid-col isg-grid-col--right isg-product-content__col--size-panel">
					<div class="isg-size-tables">
						<div class="isg-size-tables__pair">
							<?php $render_size_table($size_rows_left, $head_left, $head_right); ?>
						</div>
						<div class="isg-size-tables__pair">
							<?php $render_size_table($size_rows_right, $head_left, $head_right); ?>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
