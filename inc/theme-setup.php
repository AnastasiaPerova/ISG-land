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

function isg_allow_svg_uploads(array $mimes): array {
	if (current_user_can('upload_files')) {
		$mimes['svg'] = 'image/svg+xml';
	}

	return $mimes;
}
add_filter('upload_mimes', 'isg_allow_svg_uploads');

function isg_check_svg_filetype(array $data, string $file, string $filename, array $mimes): array {
	unset($file, $mimes);

	if (!current_user_can('upload_files')) {
		return $data;
	}

	if (strtolower(pathinfo($filename, PATHINFO_EXTENSION)) === 'svg') {
		$data['ext']  = 'svg';
		$data['type'] = 'image/svg+xml';
	}

	return $data;
}
add_filter('wp_check_filetype_and_ext', 'isg_check_svg_filetype', 10, 4);

function isg_body_classes(array $classes): array {
	$classes[] = 'isg-wp-theme';
	$classes[] = 'isg-preloader-active';

	if (is_404()) {
		$classes[] = 'isg-404-page';
	}

	return $classes;
}
add_filter('body_class', 'isg_body_classes');

