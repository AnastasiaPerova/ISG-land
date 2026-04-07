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
