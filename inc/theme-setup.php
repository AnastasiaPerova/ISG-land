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

function isg_body_classes(array $classes): array {
	$classes[] = 'isg-wp-theme';
	$classes[] = 'isg-preloader-active';

	if (is_404()) {
		$classes[] = 'isg-404-page';
	}

	return $classes;
}
add_filter('body_class', 'isg_body_classes');

