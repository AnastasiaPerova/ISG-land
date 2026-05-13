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
	array('label' => 'Certificates', 'anchor' => '#isg-certificates'),
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

if (function_exists('pll_the_languages')) {
	$polylang_languages = pll_the_languages(
		array(
			'raw' => 1,
			'hide_if_no_translation' => 0,
			'hide_current' => 0,
		)
	);

	if (is_array($polylang_languages) && !empty($polylang_languages)) {
		$languages = array();

		foreach ($polylang_languages as $polylang_language) {
			$slug = strtolower(trim((string) ($polylang_language['slug'] ?? '')));
			$code = strtoupper(trim((string) ($polylang_language['slug'] ?? $polylang_language['locale'] ?? $polylang_language['name'] ?? '')));
			$url = isg_language_switch_url($slug, (string) ($polylang_language['url'] ?? ''));

			if ($code === '') {
				continue;
			}

			$languages[] = array(
				'code' => $code,
				'slug' => $slug !== '' ? $slug : strtolower($code),
				'url' => $url,
				'is_active' => !empty($polylang_language['current_lang']),
			);
		}
	}
}

$normalized_languages = array();
foreach ($languages as $language) {
	$code = strtoupper(trim((string) ($language['code'] ?? '')));
	if ($code === '') {
		continue;
	}

	$slug = strtolower(trim((string) ($language['slug'] ?? $code)));
	$url = isg_language_switch_url($slug, (string) ($language['url'] ?? ''));

	$normalized_languages[] = array(
		'code' => $code,
		'slug' => $slug !== '' ? $slug : strtolower($code),
		'url' => $url,
		'is_active' => !empty($language['is_active']),
	);
}

if (empty($normalized_languages)) {
	$normalized_languages = $default_languages;
}

$active_index = null;
foreach ($normalized_languages as $index => $language) {
	if (!empty($language['is_active'])) {
		$active_index = $index;
		break;
	}
}

if ($active_index === null) {
	$active_index = 0;
}

foreach ($normalized_languages as $index => $language) {
	$normalized_languages[$index]['is_active'] = $index === $active_index;
}

$languages = $normalized_languages;
$current_language = strtoupper((string) ($languages[$active_index]['code'] ?? 'EN'));

$logo_url = isg_acf_image_url('header_logo', 'option', isg_asset_uri('img/logo_footer.svg'));
$mobile_logo_url = isg_acf_image_url('header_mobile_logo', 'option', isg_asset_uri('img/logo-short.svg'));
$eu_logo_url = isg_acf_current_option_image_url('header_eu_logo');
$eu_logo_link = isg_link_url(isg_acf_current_option('header_eu_logo_page_link', ''));
$home_hero_url = isg_anchor_url('#isg-hero', '#isg-hero');

$contact_line_1 = (string) isg_acf_option('header_contact_line_1', 'Mon-Fri | 8:00-16:00');
$contact_line_2 = (string) isg_acf_option('header_contact_line_2', 'Phone | +48 881 560 845');
$rfq_label = (string) isg_acf_option('header_rfq_label', 'Send RFQ');
$rfq_link = isg_anchor_url((string) isg_acf_option('header_rfq_link', '#isg-rfq-content'), '#isg-rfq-content');

$contact_phone_match = array();
preg_match('/\+[\d\s().-]+|\d[\d\s().-]{5,}/', $contact_line_2, $contact_phone_match);

$contact_phone_display = trim((string) ($contact_phone_match[0] ?? ''));
$contact_phone_href = $contact_phone_display !== '' ? preg_replace('/(?!^\+)[^\d]/', '', $contact_phone_display) : '';
?>
<header class="isg-site-header isg-hero__header" data-isg-sticky-header>
	<div class="isg-site-header__chrome">
		<div class="isg-hero__nav-wrap isg-header-desktop-only">
			<nav class="isg-nav-pill" aria-label="<?php esc_attr_e('Primary', 'isg'); ?>" data-isg-section-nav>
				<!-- <a class="isg-hero__logo isg-nav-pill__brand" href="<?php echo esc_url($home_hero_url); ?>" aria-label="<?php esc_attr_e('ISG - Home', 'isg'); ?>">
					<img class="isg-hero__logo-img" src="<?php echo esc_url($logo_url); ?>" alt="" width="170" height="62" decoding="async" />
				</a> -->

				<div class="isg-nav-pill__inner">
					<div class="isg-nav-pill__row isg-nav-pill__row--slider isg-nav-pill__row--sections isg-nav-pill__row--slider--init isg-header-nav"
						data-isg-nav-slider>
						<span class="isg-nav-pill__slider" aria-hidden="true"></span>
						<?php foreach ($nav_items as $item): ?>
							<?php
							$label = isset($item['label']) ? (string) $item['label'] : '';
							$anchor = isg_anchor_url(isset($item['anchor']) ? (string) $item['anchor'] : '#', '#');
							if ($label === '') {
								continue;
							}
							?>
							<a class="isg-btn isg-btn--ghost-dark"
								href="<?php echo esc_url($anchor); ?>"><?php echo esc_html($label); ?></a>
						<?php endforeach; ?>
					</div>
				</div>

				<div class="isg-header-contact" aria-label="<?php esc_attr_e('Contact information', 'isg'); ?>">
					<?php if ($eu_logo_url !== ''): ?>
						<?php if ($eu_logo_link !== ''): ?>
							<a class="isg-header-contact__eu-link" href="<?php echo esc_url($eu_logo_link); ?>"
								aria-label="<?php esc_attr_e('Dofinansowane przez Unię Europejską', 'isg'); ?>">
								<img class="isg-header-contact__eu-logo" src="<?php echo esc_url($eu_logo_url); ?>" alt=""
									width="360" height="78" decoding="async" />
							</a>
						<?php else: ?>
							<span class="isg-header-contact__eu-link">
								<img class="isg-header-contact__eu-logo" src="<?php echo esc_url($eu_logo_url); ?>" alt=""
									width="360" height="78" decoding="async" />
							</span>
						<?php endif; ?>
						<span class="isg-header-contact__dot" aria-hidden="true"></span>
					<?php endif; ?>
					<div class="isg-header-contact__text">
						<span><?php echo esc_html($contact_line_1); ?></span>
						<?php if ($contact_phone_href !== ''): ?>
							<a
								href="<?php echo esc_url('tel:' . $contact_phone_href); ?>"><?php echo esc_html($contact_line_2); ?></a>
						<?php else: ?>
							<span><?php echo esc_html($contact_line_2); ?></span>
						<?php endif; ?>
					</div>
				</div>

				<a class="isg-btn isg-btn--ghost-dark isg-header-rfq"
					href="<?php echo esc_url($rfq_link); ?>"><?php echo esc_html($rfq_label); ?></a>

				<div class="isg-hero__lang">
					<div class="isg-lang-dropdown" data-isg-lang-nav>
						<button type="button" class="isg-lang-dropdown__toggle isg-btn isg-btn--ghost-dark"
							data-isg-lang-toggle aria-haspopup="listbox" aria-expanded="false">
							<span class="isg-lang-dropdown__current"
								data-isg-lang-current><?php echo esc_html($current_language); ?></span>
							<span class="isg-lang-dropdown__chevron" aria-hidden="true"></span>
						</button>
						<div class="isg-lang-dropdown__menu" data-isg-lang-menu role="listbox" hidden>
							<?php foreach ($languages as $index => $lang): ?>
								<?php
								$code = strtoupper((string) ($lang['code'] ?? ''));
								$slug = strtolower((string) ($lang['slug'] ?? $code));
								$url = (string) ($lang['url'] ?? '');
								$is_active = !empty($lang['is_active']);
								if ($code === '') {
									continue;
								}
								?>
								<a class="isg-lang-dropdown__option isg-btn isg-btn--ghost-dark<?php echo $is_active ? ' isg-btn--active' : ''; ?>"
									data-isg-lang="<?php echo esc_attr($slug); ?>"
									data-isg-lang-url="<?php echo esc_url($url); ?>" role="option"
									aria-selected="<?php echo $is_active ? 'true' : 'false'; ?>"
									href="<?php echo esc_url($url !== '' ? $url : '#'); ?>"><?php echo esc_html($code); ?></a>
							<?php endforeach; ?>
						</div>
					</div>
				</div>
			</nav>
		</div>

		<a class="isg-header-mobile-logo" href="<?php echo esc_url($home_hero_url); ?>"
			aria-label="<?php esc_attr_e('ISG - Home', 'isg'); ?>">
			<img class="isg-header-mobile-logo__img" src="<?php echo esc_url($mobile_logo_url); ?>" alt="" width="66"
				height="23" decoding="async" />
		</a>

		<?php if ($eu_logo_url !== ''): ?>
			<?php if ($eu_logo_link !== ''): ?>
				<a class="isg-header-mobile-eu-logo" href="<?php echo esc_url($eu_logo_link); ?>"
					aria-label="<?php esc_attr_e('Dofinansowane przez Unię Europejską', 'isg'); ?>">
					<img class="isg-header-mobile-eu-logo__img" src="<?php echo esc_url($eu_logo_url); ?>" alt="" width="360"
						height="78" decoding="async" />
				</a>
			<?php else: ?>
				<span class="isg-header-mobile-eu-logo">
					<img class="isg-header-mobile-eu-logo__img" src="<?php echo esc_url($eu_logo_url); ?>" alt="" width="360"
						height="78" decoding="async" />
				</span>
			<?php endif; ?>
		<?php endif; ?>

		<button type="button" class="isg-burger" data-isg-burger aria-controls="isg-nav-drawer" aria-expanded="false"
			aria-label="<?php esc_attr_e('Open menu', 'isg'); ?>">
			<span class="isg-burger__bars" aria-hidden="true"></span>
		</button>
	</div>

	<div id="isg-nav-drawer" class="isg-nav-drawer" aria-hidden="true">
		<button type="button" class="isg-nav-drawer__backdrop" data-isg-drawer-close tabindex="-1"
			aria-label="<?php esc_attr_e('Close menu', 'isg'); ?>"></button>
		<div class="isg-nav-drawer__panel">
			<nav class="isg-nav-drawer__nav" aria-label="<?php esc_attr_e('Primary mobile', 'isg'); ?>"
				data-isg-section-nav>
				<?php foreach ($nav_items as $item): ?>
					<?php
					$label = isset($item['label']) ? (string) $item['label'] : '';
					$anchor = isg_anchor_url(isset($item['anchor']) ? (string) $item['anchor'] : '#', '#');
					if ($label === '') {
						continue;
					}
					?>
					<a class="isg-btn isg-btn--ghost-dark isg-nav-drawer__link"
						href="<?php echo esc_url($anchor); ?>"><?php echo esc_html($label); ?></a>
				<?php endforeach; ?>
				<a class="isg-btn isg-btn--ghost-dark isg-nav-drawer__link"
					href="<?php echo esc_url($rfq_link); ?>"><?php echo esc_html($rfq_label); ?></a>
			</nav>

			<div class="isg-nav-drawer__footer">
				<div class="isg-nav-drawer__contact" aria-label="<?php esc_attr_e('Contact information', 'isg'); ?>">
					<span class="isg-header-contact__dot" aria-hidden="true"></span>
					<div class="isg-nav-drawer__contact-text">
						<span><?php echo esc_html($contact_line_1); ?></span>
						<?php if ($contact_phone_href !== ''): ?>
							<a
								href="<?php echo esc_url('tel:' . $contact_phone_href); ?>"><?php echo esc_html($contact_line_2); ?></a>
						<?php else: ?>
							<span><?php echo esc_html($contact_line_2); ?></span>
						<?php endif; ?>
					</div>
				</div>

				<div class="isg-nav-drawer__lang">
					<div class="isg-lang-dropdown isg-lang-dropdown--drawer" data-isg-lang-nav>
						<button type="button" class="isg-lang-dropdown__toggle isg-btn isg-btn--ghost-dark"
							data-isg-lang-toggle aria-haspopup="listbox" aria-expanded="false">
							<span class="isg-lang-dropdown__current"
								data-isg-lang-current><?php echo esc_html($current_language); ?></span>
							<span class="isg-lang-dropdown__chevron" aria-hidden="true"></span>
						</button>
						<div class="isg-lang-dropdown__menu" data-isg-lang-menu role="listbox" hidden>
							<?php foreach ($languages as $index => $lang): ?>
								<?php
								$code = strtoupper((string) ($lang['code'] ?? ''));
								$slug = strtolower((string) ($lang['slug'] ?? $code));
								$url = (string) ($lang['url'] ?? '');
								$is_active = !empty($lang['is_active']);
								if ($code === '') {
									continue;
								}
								?>
								<a class="isg-lang-dropdown__option isg-btn isg-btn--ghost-dark<?php echo $is_active ? ' isg-btn--active' : ''; ?>"
									data-isg-lang="<?php echo esc_attr($slug); ?>"
									data-isg-lang-url="<?php echo esc_url($url); ?>" role="option"
									aria-selected="<?php echo $is_active ? 'true' : 'false'; ?>"
									href="<?php echo esc_url($url !== '' ? $url : '#'); ?>"><?php echo esc_html($code); ?></a>
							<?php endforeach; ?>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</header>