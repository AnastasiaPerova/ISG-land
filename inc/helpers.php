<?php
/**
 * Helper functions.
 *
 * @package ISG
 */

if (!defined('ABSPATH')) {
	exit;
}

function isg_theme_path(string $path = ''): string {
	return get_template_directory() . ($path ? '/' . ltrim($path, '/') : '');
}

function isg_theme_uri(string $path = ''): string {
	return get_template_directory_uri() . ($path ? '/' . ltrim($path, '/') : '');
}

function isg_asset_uri(string $path = ''): string {
	return isg_theme_uri('assets/' . ltrim($path, '/'));
}

function isg_absolute_url(string $url, string $default = ''): string {
	$url = trim($url);
	if ($url === '') {
		return $default;
	}

	if (preg_match('#^(?:[a-z][a-z0-9+.-]*:)?//#i', $url)) {
		return $url;
	}

	if (strpos($url, 'assets/') === 0) {
		return isg_asset_uri(substr($url, strlen('assets/')));
	}

	if ($url[0] === '/') {
		return home_url($url);
	}

	return home_url('/' . ltrim($url, '/'));
}

function isg_file_version(string $relative_path): string {
	$full_path = isg_theme_path($relative_path);
	if (file_exists($full_path)) {
		return (string) filemtime($full_path);
	}
	return wp_get_theme()->get('Version');
}

function isg_acf_value(string $field_name, $default = '', $post_id = null) {
	if (!function_exists('get_field')) {
		return $default;
	}
	$value = get_field($field_name, $post_id);
	return ($value === null || $value === false || $value === '') ? $default : $value;
}

function isg_current_language_slug(): string {
	if (function_exists('pll_current_language')) {
		$slug = strtolower(trim((string) pll_current_language('slug')));
		if ($slug !== '') {
			return $slug;
		}
	}

	return '';
}

function isg_acf_option_post_ids(): array {
	$post_ids = array();
	$lang_slug = isg_current_language_slug();

	if ($lang_slug !== '') {
		$post_ids[] = 'options_' . $lang_slug;
	}

	$post_ids[] = 'option';
	$post_ids[] = 'options';

	return array_values(array_unique(array_filter($post_ids)));
}

function isg_acf_option(string $field_name, $default = '') {
	foreach (isg_acf_option_post_ids() as $post_id) {
		$value = isg_acf_value($field_name, null, $post_id);
		if ($value !== null && $value !== false && $value !== '') {
			return $value;
		}
	}

	return $default;
}

function isg_acf_current_option_post_id(): string {
	$lang_slug = isg_current_language_slug();
	if ($lang_slug !== '') {
		return 'options_' . $lang_slug;
	}

	return 'option';
}

function isg_acf_current_option(string $field_name, $default = '') {
	return isg_acf_value($field_name, $default, isg_acf_current_option_post_id());
}

function isg_acf_current_option_image_url(string $field_name, string $default = ''): string {
	if (!function_exists('get_field')) {
		return $default;
	}

	$image = get_field($field_name, isg_acf_current_option_post_id());
	return isg_image_url($image, $default);
}

function isg_acf_current_option_image_dimensions(string $field_name, int $default_width = 0, int $default_height = 0): array {
	if (!function_exists('get_field')) {
		return isg_image_dimensions('', $default_width, $default_height);
	}

	$image = get_field($field_name, isg_acf_current_option_post_id());
	return isg_image_dimensions($image, $default_width, $default_height);
}

function isg_acf_image_url(string $field_name, string $context = 'option', string $default = ''): string {
	if (!function_exists('get_field')) {
		return $default;
	}

	$contexts = in_array($context, array('option', 'options'), true)
		? isg_acf_option_post_ids()
		: array($context);

	foreach ($contexts as $post_id) {
		$image = get_field($field_name, $post_id);

		if (is_array($image) && !empty($image['url'])) {
			return (string) $image['url'];
		}
		if (is_numeric($image)) {
			$url = wp_get_attachment_image_url((int) $image, 'full');
			if ($url) {
				return $url;
			}
		}
		if (is_string($image) && $image !== '') {
			return $image;
		}
	}

	return $default;
}

function isg_acf_image_dimensions(string $field_name, string $context = 'option', int $default_width = 0, int $default_height = 0): array {
	if (!function_exists('get_field')) {
		return isg_image_dimensions('', $default_width, $default_height);
	}

	$contexts = in_array($context, array('option', 'options'), true)
		? isg_acf_option_post_ids()
		: array($context);

	foreach ($contexts as $post_id) {
		$image = get_field($field_name, $post_id);

		if (!empty($image)) {
			return isg_image_dimensions($image, $default_width, $default_height);
		}
	}

	return isg_image_dimensions('', $default_width, $default_height);
}

function isg_image_url($image, string $default = ''): string {
	if (is_array($image) && !empty($image['url'])) {
		return (string) $image['url'];
	}
	if (is_numeric($image)) {
		$url = wp_get_attachment_image_url((int) $image, 'full');
		return $url ?: $default;
	}
	if (is_string($image) && $image !== '') {
		return $image;
	}
	return $default;
}

function isg_image_alt($image, string $default = ''): string {
	if (is_array($image) && !empty($image['alt'])) {
		return (string) $image['alt'];
	}
	return $default;
}

function isg_image_dimensions($image, int $default_width = 0, int $default_height = 0): array {
	$width  = $default_width;
	$height = $default_height;

	if (is_array($image)) {
		$raw_width  = isset($image['width']) ? (int) $image['width'] : 0;
		$raw_height = isset($image['height']) ? (int) $image['height'] : 0;
		if ($raw_width > 0 && $raw_height > 0) {
			$width  = $raw_width;
			$height = $raw_height;
		}
	} elseif (is_numeric($image)) {
		$src = wp_get_attachment_image_src((int) $image, 'full');
		if (is_array($src) && !empty($src[1]) && !empty($src[2])) {
			$width  = (int) $src[1];
			$height = (int) $src[2];
		}
	}

	return array(
		'width'  => max(0, $width),
		'height' => max(0, $height),
	);
}

function isg_color_to_rgba($color, float $alpha = 1, string $default = '#000000'): string {
	$color = trim((string) $color);

	if (function_exists('sanitize_hex_color')) {
		$color = sanitize_hex_color($color) ?: sanitize_hex_color($default);
	}

	if (!is_string($color) || !preg_match('/^#([a-f0-9]{3}|[a-f0-9]{6})$/i', $color)) {
		$color = $default;
	}

	$hex = ltrim($color, '#');
	if (strlen($hex) === 3) {
		$hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
	}

	$alpha = max(0, min(1, $alpha));

	return sprintf(
		'rgba(%d, %d, %d, %.3F)',
		hexdec(substr($hex, 0, 2)),
		hexdec(substr($hex, 2, 2)),
		hexdec(substr($hex, 4, 2)),
		$alpha
	);
}

function isg_link_url($link, string $default = ''): string {
	if (is_array($link)) {
		if (!empty($link['url'])) {
			return (string) $link['url'];
		}

		$first_link = reset($link);
		return isg_link_url($first_link, $default);
	}

	if (is_numeric($link)) {
		$url = get_permalink((int) $link);
		return $url ? (string) $url : $default;
	}

	if (is_string($link) && trim($link) !== '') {
		return trim($link);
	}

	return $default;
}

function isg_acf_group(string $field_name, array $default = array(), $post_id = null): array {
	$value = isg_acf_value($field_name, $default, $post_id);
	return is_array($value) ? $value : $default;
}

function isg_anchor(string $value, string $fallback = '#'): string {
	$value = trim((string) $value);
	if ($value === '') {
		return $fallback;
	}
	if ($value[0] !== '#') {
		$value = '#' . ltrim($value, '#');
	}
	return $value;
}

function isg_is_current_front_page(): bool {
	if (is_front_page()) {
		return true;
	}

	$front_page_id = (int) get_option('page_on_front');
	if ($front_page_id <= 0 || !is_singular()) {
		return false;
	}

	$current_id = (int) get_queried_object_id();
	if ($current_id === $front_page_id) {
		return true;
	}

	if (function_exists('pll_get_post')) {
		$lang_slug = isg_current_language_slug();
		if ($lang_slug !== '') {
			$translated_front_id = (int) pll_get_post($front_page_id, $lang_slug);
			if ($translated_front_id > 0 && $translated_front_id === $current_id) {
				return true;
			}
		}
	}

	return false;
}

function isg_normalize_site_url(string $url): string {
	$url = trim($url);
	if ($url === '') {
		return '';
	}

	$home_url = home_url('/');
	$home     = wp_parse_url($home_url);
	$parsed   = wp_parse_url($url);

	if ($parsed === false || $home === false) {
		return $url;
	}

	$path     = isset($parsed['path']) ? (string) $parsed['path'] : '/';
	$query    = isset($parsed['query']) && $parsed['query'] !== '' ? '?' . $parsed['query'] : '';
	$fragment = isset($parsed['fragment']) && $parsed['fragment'] !== '' ? '#' . $parsed['fragment'] : '';

	if (!isset($parsed['host'])) {
		if (str_starts_with($url, '#') || str_starts_with($url, '?')) {
			return $url;
		}

		if (!str_starts_with($path, '/')) {
			$path = '/' . ltrim($path, '/');
		}

		return home_url($path . $query . $fragment);
	}

	$scheme = isset($home['scheme']) ? $home['scheme'] . '://' : '';
	$host   = (string) ($home['host'] ?? '');
	$port   = isset($home['port']) ? ':' . $home['port'] : '';

	if ($host === '') {
		return $url;
	}

	if (!str_starts_with($path, '/')) {
		$path = '/' . ltrim($path, '/');
	}

	return $scheme . $host . $port . $path . $query . $fragment;
}

function isg_language_root_url(string $lang_slug = ''): string {
	$lang_slug = strtolower(trim($lang_slug));
	$home_url  = isg_normalize_site_url(home_url('/'));

	if ($lang_slug === '') {
		return $home_url;
	}

	if (function_exists('pll_home_url')) {
		$polylang_home_url = pll_home_url($lang_slug);
		if (is_string($polylang_home_url) && $polylang_home_url !== '') {
			return isg_normalize_site_url($polylang_home_url);
		}
	}

	$default_lang = '';
	if (function_exists('pll_default_language')) {
		$default_lang = strtolower(trim((string) pll_default_language('slug')));
	}

	if ($default_lang !== '' && $lang_slug === $default_lang) {
		return $home_url;
	}

	return isg_normalize_site_url(home_url('/' . $lang_slug . '/'));
}

function isg_front_page_url(): string {
	$lang_slug = isg_current_language_slug();

	if ($lang_slug !== '') {
		return isg_language_root_url($lang_slug);
	}

	$front_page_id = (int) get_option('page_on_front');
	if ($front_page_id > 0) {
		if (function_exists('pll_get_post') && $lang_slug !== '') {
			$translated_front_id = (int) pll_get_post($front_page_id, $lang_slug);
			if ($translated_front_id > 0) {
				$url = get_permalink($translated_front_id);
				if ($url) {
					return (string) $url;
				}
			}
		}

		$url = get_permalink($front_page_id);
		if ($url) {
			return isg_normalize_site_url((string) $url);
		}
	}

	return isg_normalize_site_url(home_url('/'));
}

function isg_anchor_url(string $value, string $fallback = '#'): string {
	$anchor = isg_anchor($value, $fallback);
	if (isg_is_current_front_page()) {
		return $anchor;
	}

	return untrailingslashit(isg_front_page_url()) . '/' . $anchor;
}

function isg_format_text_with_breaks($value): string {
	$value = (string) $value;
	$value = wp_kses($value, array('br' => array()));
	$value = str_replace(array("\r\n", "\r"), "\n", $value);
	$value = preg_replace('/\s*<br\s*\/?>\s*/i', "\n", $value);
	$value = preg_replace("/\n{2,}/", "\n", $value);

	return nl2br(esc_html($value));
}

function isg_language_switch_url(string $lang_slug, string $fallback = ''): string {
	$lang_slug = strtolower(trim($lang_slug));
	if ($lang_slug === '') {
		return $fallback;
	}

	if (isg_is_current_front_page()) {
		if ($fallback !== '') {
			return isg_normalize_site_url($fallback);
		}

		return isg_language_root_url($lang_slug);
	}

	if (is_singular()) {
		$current_id = (int) get_queried_object_id();
		if ($current_id > 0 && function_exists('pll_get_post')) {
			$translated_id = (int) pll_get_post($current_id, $lang_slug);
			if ($translated_id > 0) {
				$url = get_permalink($translated_id);
				if ($url) {
					return isg_normalize_site_url((string) $url);
				}
			}
		}
	}

	if ((is_category() || is_tag() || is_tax()) && function_exists('pll_get_term')) {
		$current_term_id = (int) get_queried_object_id();
		if ($current_term_id > 0) {
			$translated_term_id = (int) pll_get_term($current_term_id, $lang_slug);
			if ($translated_term_id > 0) {
				$url = get_term_link($translated_term_id);
				if (!is_wp_error($url) && $url) {
					return isg_normalize_site_url((string) $url);
				}
			}
		}
	}

	if ($fallback !== '') {
		$query = wp_parse_args((string) wp_parse_url($fallback, PHP_URL_QUERY));
		$fallback_page_id = (int) ($query['page_id'] ?? 0);

		if ($fallback_page_id > 0 && function_exists('pll_get_post')) {
			$translated_id = (int) pll_get_post($fallback_page_id, $lang_slug);
			if ($translated_id > 0) {
				$url = get_permalink($translated_id);
				if ($url) {
					return isg_normalize_site_url((string) $url);
				}
			}
		}
	}

	return $fallback !== '' ? isg_normalize_site_url($fallback) : isg_language_root_url($lang_slug);
}

function isg_redirect_front_page_variants(): void {
	if (is_admin() || wp_doing_ajax() || is_preview() || !isg_is_current_front_page()) {
		return;
	}

	$target = isg_front_page_url();
	if ($target === '') {
		return;
	}

	$request_uri = isset($_SERVER['REQUEST_URI']) ? (string) wp_unslash($_SERVER['REQUEST_URI']) : '';
	$current_url = home_url($request_uri);

	$current_path = untrailingslashit((string) wp_parse_url($current_url, PHP_URL_PATH));
	$target_path  = untrailingslashit((string) wp_parse_url($target, PHP_URL_PATH));

	if ($current_path === $target_path) {
		return;
	}

	$query_args = wp_parse_args((string) wp_parse_url($current_url, PHP_URL_QUERY));
	unset($query_args['page_id'], $query_args['p'], $query_args['lang'], $query_args['preview']);

	if (!empty($query_args)) {
		$target = add_query_arg($query_args, $target);
	}

	wp_safe_redirect($target, 301);
	exit;
}
add_action('template_redirect', 'isg_redirect_front_page_variants', 1);

function isg_render_static_partial(string $file_name): void {
	$relative = 'partials/' . ltrim($file_name, '/');
	$full     = isg_theme_path($relative);

	if (!file_exists($full)) {
		return;
	}

	$html   = file_get_contents($full);
	$assets = trailingslashit(isg_theme_uri('assets'));

	if ($html === false) {
		return;
	}

	$search  = array(
		'src="assets/',
		"src='assets/",
		'href="assets/',
		"href='assets/",
		'poster="assets/',
		"poster='assets/",
		'data-isg-lightbox="assets/',
		"data-isg-lightbox='assets/",
		"url('assets/",
		'url("assets/',
		'style="background-image: url(\'assets/',
		'style="background-image: url("assets/',
	);
	$replace = array(
		'src="' . $assets,
		"src='" . $assets,
		'href="' . $assets,
		"href='" . $assets,
		'poster="' . $assets,
		"poster='" . $assets,
		'data-isg-lightbox="' . $assets,
		"data-isg-lightbox='" . $assets,
		"url('" . $assets,
		'url("' . $assets,
		'style="background-image: url(\'' . $assets,
		'style="background-image: url("' . $assets,
	);

	echo str_replace($search, $replace, $html); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}
