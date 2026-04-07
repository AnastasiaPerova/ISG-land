<?php
/**
 * Enqueue scripts and styles.
 *
 * @package ISG
 */

if (!defined('ABSPATH')) {
	exit;
}

function isg_resource_hints(array $urls, string $relation_type): array {
	if ('preconnect' === $relation_type) {
		$urls[] = 'https://fonts.googleapis.com';
		$urls[] = array(
			'href'        => 'https://fonts.gstatic.com',
			'crossorigin' => 'anonymous',
		);
	}

	return $urls;
}
add_filter('wp_resource_hints', 'isg_resource_hints', 10, 2);

function isg_enqueue_assets(): void {
	wp_enqueue_style(
		'isg-fonts',
		'https://fonts.googleapis.com/css2?family=DM+Mono:wght@500&family=Plus+Jakarta+Sans:wght@400;500;600&display=swap',
		array(),
		null
	);

	wp_enqueue_style(
		'isg-main',
		isg_asset_uri('css/main.css'),
		array('isg-fonts'),
		isg_file_version('assets/css/main.css')
	);

	if (file_exists(isg_theme_path('assets/css/lenis.css'))) {
		wp_enqueue_style(
			'isg-lenis',
			isg_asset_uri('css/lenis.css'),
			array('isg-main'),
			isg_file_version('assets/css/lenis.css')
		);
	}

	wp_enqueue_style(
		'isg-theme',
		get_stylesheet_uri(),
		array('isg-main'),
		isg_file_version('style.css')
	);

	wp_enqueue_script(
		'isg-main',
		isg_asset_uri('js/main.bundle.js'),
		array(),
		isg_file_version('assets/js/main.bundle.js'),
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);

	wp_add_inline_script('isg-main', 'window.ISG_SERVER_RENDERED = true;', 'before');
}
add_action('wp_enqueue_scripts', 'isg_enqueue_assets');

