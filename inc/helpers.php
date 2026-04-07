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

function isg_acf_option(string $field_name, $default = '') {
	return isg_acf_value($field_name, $default, 'option');
}

function isg_acf_image_url(string $field_name, string $context = 'option', string $default = ''): string {
	if (!function_exists('get_field')) {
		return $default;
	}

	$image = get_field($field_name, $context);

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

function isg_anchor_url(string $value, string $fallback = '#'): string {
	$anchor = isg_anchor($value, $fallback);
	if (is_front_page()) {
		return $anchor;
	}
	return home_url('/' . $anchor);
}

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
