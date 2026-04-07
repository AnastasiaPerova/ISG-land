<?php
/**
 * Site header.
 *
 * @package ISG
 */

$default_nav_items = array(
	array('label' => 'Products', 'anchor' => '#isg-product'),
	array('label' => 'Applications', 'anchor' => '#isg-application'),
	array('label' => 'Production', 'anchor' => '#isg-quality'),
	array('label' => 'Certificates', 'anchor' => '#isg-about'),
);

$nav_items = isg_acf_option('header_nav_items', $default_nav_items);
if (!is_array($nav_items) || empty($nav_items)) {
	$nav_items = $default_nav_items;
}

$default_languages = array(
	array('code' => 'EN'),
	array('code' => 'PL'),
	array('code' => 'DE'),
);

$languages = isg_acf_option('header_languages', $default_languages);
if (!is_array($languages) || empty($languages)) {
	$languages = $default_languages;
}

$current_language = strtoupper((string) ($languages[0]['code'] ?? 'EN'));

$logo_url        = isg_acf_image_url('header_logo', 'option', isg_asset_uri('img/logo.svg'));
$mobile_logo_url = isg_acf_image_url('header_mobile_logo', 'option', $logo_url);
$home_hero_url   = isg_anchor_url('#isg-hero', '#isg-hero');

$contact_line_1 = (string) isg_acf_option('header_contact_line_1', 'Mon-Fri | 8:00-16:00');
$contact_line_2 = (string) isg_acf_option('header_contact_line_2', 'Phone | +48 881 560 845');
$rfq_label      = (string) isg_acf_option('header_rfq_label', 'Send RFQ');
$rfq_link       = isg_anchor_url((string) isg_acf_option('header_rfq_link', '#isg-rfq-content'), '#isg-rfq-content');
$language_label = (string) isg_acf_option('header_language_label', 'Language');
?>
<header class="isg-site-header isg-hero__header" data-isg-sticky-header>
	<div class="isg-site-header__chrome">
		<a class="isg-header-mobile-logo" href="<?php echo esc_url($home_hero_url); ?>" aria-label="<?php esc_attr_e('ISG - Home', 'isg'); ?>">
			<img class="isg-header-mobile-logo__img" src="<?php echo esc_url($mobile_logo_url); ?>" alt="ISG" width="170" height="62" decoding="async" />
		</a>

		<div class="isg-hero__nav-wrap isg-header-desktop-only">
			<nav class="isg-nav-pill" aria-label="<?php esc_attr_e('Primary', 'isg'); ?>" data-isg-section-nav>
				<a class="isg-hero__logo isg-nav-pill__brand" href="<?php echo esc_url($home_hero_url); ?>" aria-label="<?php esc_attr_e('ISG - Home', 'isg'); ?>">
					<img class="isg-hero__logo-img" src="<?php echo esc_url($logo_url); ?>" alt="" width="170" height="62" decoding="async" />
				</a>

				<div class="isg-nav-pill__inner">
					<div
						class="isg-nav-pill__row isg-nav-pill__row--slider isg-nav-pill__row--sections isg-nav-pill__row--slider--init isg-header-nav"
						data-isg-nav-slider
					>
						<span class="isg-nav-pill__slider" aria-hidden="true"></span>
						<?php foreach ($nav_items as $item) : ?>
							<?php
							$label  = isset($item['label']) ? (string) $item['label'] : '';
							$anchor = isg_anchor_url(isset($item['anchor']) ? (string) $item['anchor'] : '#', '#');
							if ($label === '') {
								continue;
							}
							?>
							<a class="isg-btn isg-btn--ghost-dark" href="<?php echo esc_url($anchor); ?>"><?php echo esc_html($label); ?></a>
						<?php endforeach; ?>
					</div>
				</div>

				<div class="isg-header-contact" aria-label="<?php esc_attr_e('Contact information', 'isg'); ?>">
					<span class="isg-header-contact__dot" aria-hidden="true"></span>
					<div class="isg-header-contact__text">
						<span><?php echo esc_html($contact_line_1); ?></span>
						<span><?php echo esc_html($contact_line_2); ?></span>
					</div>
				</div>

				<a class="isg-btn isg-btn--ghost-dark isg-header-rfq" href="<?php echo esc_url($rfq_link); ?>"><?php echo esc_html($rfq_label); ?></a>

				<div class="isg-hero__lang">
					<div class="isg-lang-dropdown" data-isg-lang-nav>
						<button type="button" class="isg-lang-dropdown__toggle isg-btn isg-btn--ghost-dark" data-isg-lang-toggle aria-haspopup="listbox" aria-expanded="false">
							<span class="isg-lang-dropdown__current" data-isg-lang-current><?php echo esc_html($current_language); ?></span>
							<span class="isg-lang-dropdown__chevron" aria-hidden="true"></span>
						</button>
						<div class="isg-lang-dropdown__menu" data-isg-lang-menu role="listbox" hidden>
							<?php foreach ($languages as $index => $lang) : ?>
								<?php
								$code      = strtoupper((string) ($lang['code'] ?? ''));
								$is_active = $index === 0;
								if ($code === '') {
									continue;
								}
								?>
								<button
									type="button"
									class="isg-lang-dropdown__option isg-btn isg-btn--ghost-dark<?php echo $is_active ? ' isg-btn--active' : ''; ?>"
									data-isg-lang="<?php echo esc_attr(strtolower($code)); ?>"
									role="option"
									aria-selected="<?php echo $is_active ? 'true' : 'false'; ?>"
								><?php echo esc_html($code); ?></button>
							<?php endforeach; ?>
						</div>
					</div>
				</div>
			</nav>
		</div>

		<button type="button" class="isg-burger" data-isg-burger aria-controls="isg-nav-drawer" aria-expanded="false" aria-label="<?php esc_attr_e('Open menu', 'isg'); ?>">
			<span class="isg-burger__bars" aria-hidden="true"></span>
		</button>
	</div>

	<div id="isg-nav-drawer" class="isg-nav-drawer" aria-hidden="true">
		<button type="button" class="isg-nav-drawer__backdrop" data-isg-drawer-close tabindex="-1" aria-label="<?php esc_attr_e('Close menu', 'isg'); ?>"></button>
		<div class="isg-nav-drawer__panel">
			<nav class="isg-nav-drawer__nav" aria-label="<?php esc_attr_e('Primary mobile', 'isg'); ?>" data-isg-section-nav>
				<?php foreach ($nav_items as $item) : ?>
					<?php
					$label  = isset($item['label']) ? (string) $item['label'] : '';
					$anchor = isg_anchor_url(isset($item['anchor']) ? (string) $item['anchor'] : '#', '#');
					if ($label === '') {
						continue;
					}
					?>
					<a class="isg-btn isg-btn--ghost-dark isg-nav-drawer__link" href="<?php echo esc_url($anchor); ?>"><?php echo esc_html($label); ?></a>
				<?php endforeach; ?>
				<a class="isg-btn isg-btn--ghost-dark isg-nav-drawer__link" href="<?php echo esc_url($rfq_link); ?>"><?php echo esc_html($rfq_label); ?></a>
			</nav>

			<div class="isg-nav-drawer__footer">
				<div class="isg-nav-drawer__contact" aria-label="<?php esc_attr_e('Contact information', 'isg'); ?>">
					<span class="isg-nav-drawer__contact-dot" aria-hidden="true"></span>
					<div class="isg-nav-drawer__contact-text">
						<span><?php echo esc_html($contact_line_1); ?></span>
						<span><?php echo esc_html($contact_line_2); ?></span>
					</div>
				</div>

				<div class="isg-nav-drawer__lang">
					<span class="isg-nav-drawer__lang-label"><?php echo esc_html($language_label); ?></span>
					<div class="isg-lang-dropdown isg-lang-dropdown--drawer" data-isg-lang-nav>
						<button type="button" class="isg-lang-dropdown__toggle isg-btn isg-btn--ghost-dark" data-isg-lang-toggle aria-haspopup="listbox" aria-expanded="false">
							<span class="isg-lang-dropdown__current" data-isg-lang-current><?php echo esc_html($current_language); ?></span>
							<span class="isg-lang-dropdown__chevron" aria-hidden="true"></span>
						</button>
						<div class="isg-lang-dropdown__menu" data-isg-lang-menu role="listbox" hidden>
							<?php foreach ($languages as $index => $lang) : ?>
								<?php
								$code      = strtoupper((string) ($lang['code'] ?? ''));
								$is_active = $index === 0;
								if ($code === '') {
									continue;
								}
								?>
								<button
									type="button"
									class="isg-lang-dropdown__option isg-btn isg-btn--ghost-dark<?php echo $is_active ? ' isg-btn--active' : ''; ?>"
									data-isg-lang="<?php echo esc_attr(strtolower($code)); ?>"
									role="option"
									aria-selected="<?php echo $is_active ? 'true' : 'false'; ?>"
								><?php echo esc_html($code); ?></button>
							<?php endforeach; ?>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</header>
