<?php
/**
 * Theme setup.
 *
 * @package ISG
 */

if (!defined('ABSPATH')) {
	exit;
}

function isg_theme_setup(): void {
	add_theme_support('title-tag');
	add_theme_support('post-thumbnails');
	add_theme_support('menus');
	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
		)
	);

	register_nav_menus(
		array(
			'header_menu' => __('Header Menu', 'isg'),
			'footer_menu' => __('Footer Menu', 'isg'),
		)
	);
}
add_action('after_setup_theme', 'isg_theme_setup');

function isg_can_upload_svg(): bool {
	return current_user_can('upload_files');
}

function isg_allow_svg_uploads(array $mimes): array {
	if (!isg_can_upload_svg()) {
		return $mimes;
	}

	$mimes['svg'] = 'image/svg+xml';

	return $mimes;
}
add_filter('upload_mimes', 'isg_allow_svg_uploads');

function isg_check_svg_filetype(array $data, string $file, string $filename, array $mimes): array {
	unset($mimes);

	if (!isg_can_upload_svg() || strtolower(pathinfo($filename, PATHINFO_EXTENSION)) !== 'svg') {
		return $data;
	}

	$contents = is_readable($file) ? file_get_contents($file) : false;
	if (!is_string($contents) || !preg_match('/<svg[\s>]/i', $contents)) {
		return $data;
	}

	$data['ext']             = 'svg';
	$data['type']            = 'image/svg+xml';
	$data['proper_filename'] = false;

	return $data;
}
add_filter('wp_check_filetype_and_ext', 'isg_check_svg_filetype', 10, 4);

function isg_disable_upload_image_processing($threshold = false) {
	unset($threshold);
	return false;
}
add_filter('big_image_size_threshold', 'isg_disable_upload_image_processing');

function isg_disable_upload_image_subsizes(array $sizes): array {
	return array();
}
add_filter('intermediate_image_sizes_advanced', 'isg_disable_upload_image_subsizes');

function isg_disable_upload_displayable_image_processing($result, $path = '') {
	$extension = strtolower(pathinfo((string) $path, PATHINFO_EXTENSION));
	if (in_array($extension, array('jpg', 'jpeg', 'png', 'webp', 'gif', 'avif', 'heic'), true)) {
		return false;
	}

	return $result;
}
add_filter('file_is_displayable_image', 'isg_disable_upload_displayable_image_processing', 10, 2);

function isg_body_classes(array $classes): array {
	$classes[] = 'isg-wp-theme';
	$classes[] = 'isg-preloader-active';

	if (is_404()) {
		$classes[] = 'isg-404-page';
	}

	return $classes;
}
add_filter('body_class', 'isg_body_classes');

