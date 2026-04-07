<?php
/**
 * Header template.
 *
 * @package ISG
 */

?><!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo('charset'); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>
<div
	id="isg-preloader"
	class="isg-preloader"
	role="status"
	aria-live="polite"
	aria-busy="true"
	aria-label="<?php esc_attr_e('Loading page', 'isg'); ?>"
>
	<div class="isg-preloader__inner">
		<span class="isg-preloader__value" data-isg-preloader-value>0%</span>
		<span class="isg-preloader__label" data-isg-preloader-label><?php esc_html_e('Preparing assets', 'isg'); ?></span>
		<span class="isg-preloader__sr"><?php esc_html_e('Loading...', 'isg'); ?></span>
	</div>
</div>
<script>
	window.ISG_PRELOADER_DONE = false;
	window.setTimeout(function () {
		var preloader = document.getElementById('isg-preloader');
		if (window.ISG_PRELOADER_DONE || !preloader) {
			return;
		}

		window.ISG_PRELOADER_DONE = true;
		document.documentElement.classList.remove('isg-preloader-active');
		document.body.classList.remove('isg-preloader-active');
		preloader.setAttribute('aria-busy', 'false');
		preloader.classList.add('isg-preloader--done');
		window.setTimeout(function () {
			if (preloader.parentNode) {
				preloader.parentNode.removeChild(preloader);
			}
		}, 500);
	}, 6000);
</script>
<noscript>
	<style>
		html.isg-preloader-active,
		body.isg-preloader-active {
			overflow: auto !important;
		}

		#isg-preloader {
			display: none !important;
		}
	</style>
</noscript>
