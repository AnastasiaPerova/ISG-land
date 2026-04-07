<?php
/**
 * 404 template.
 *
 * @package ISG
 */

get_header();
?>
<main id="isg-main" class="isg-section-surface">
	<div class="container" style="padding-top: 18rem; padding-bottom: 10rem;">
		<h1 class="isg-h2">404</h1>
		<p class="isg-body" style="margin-top: 1.6rem;"><?php esc_html_e('Page not found.', 'isg'); ?></p>
		<p style="margin-top: 2.4rem;">
			<a class="isg-btn" href="<?php echo esc_url(home_url('/')); ?>"><?php esc_html_e('Back to home', 'isg'); ?></a>
		</p>
	</div>
</main>
<?php
get_footer();

