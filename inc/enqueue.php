<?php
/**
 * Enqueue scripts and styles.
 *
 * @package ISG
 */

if (!defined('ABSPATH')) {
	exit;
}

function isg_output_importmap(): void {
	?>
	<script type="importmap">
		{
			"imports": {
				"gsap": "https://esm.sh/gsap@3.12.5",
				"gsap/ScrollTrigger": "https://esm.sh/gsap@3.12.5/ScrollTrigger",
				"lenis": "https://esm.sh/lenis@1.1.18",
				"swiper": "https://esm.sh/swiper@11",
				"swiper/modules": "https://esm.sh/swiper@11/modules"
			}
		}
	</script>
	<?php
}
add_action('wp_head', 'isg_output_importmap', 1);

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
		isg_asset_uri('js/main.js'),
		array(),
		isg_file_version('assets/js/main.js'),
		true
	);

	wp_script_add_data('isg-main', 'type', 'module');
	wp_add_inline_script('isg-main', 'window.ISG_SERVER_RENDERED = true;', 'before');
}
add_action('wp_enqueue_scripts', 'isg_enqueue_assets');

