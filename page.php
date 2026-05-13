<?php
/**
 * Default page template.
 *
 * @package ISG
 */

get_header();
get_template_part('template-parts/site-logo');
get_template_part('template-parts/site-header');
?>
<main id="isg-main" class="isg-info-page isg-section-surface">
	<div class="container isg-info-page__inner">
		<?php
		while (have_posts()) :
			the_post();
			?>
			<article <?php post_class('isg-info-article'); ?>>
				<header class="isg-info-hero">
					<p class="isg-subtitle">
						<span class="isg-subtitle__text"><?php esc_html_e('Information', 'isg'); ?></span>
						<span class="isg-subtitle__swatch" aria-hidden="true"></span>
					</p>
					<h1 class="isg-info-hero__title isg-h2"><?php the_title(); ?></h1>
				</header>
				<div class="isg-info-content">
					<?php the_content(); ?>
				</div>
			</article>
		<?php endwhile; ?>
	</div>
</main>
<?php
get_footer();

