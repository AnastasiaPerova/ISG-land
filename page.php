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
<main id="isg-main" class="isg-section-surface">
	<div class="container" style="padding-top: 18rem; padding-bottom: 10rem;">
		<?php
		while (have_posts()) :
			the_post();
			?>
			<article <?php post_class(); ?>>
				<h1 class="isg-h2"><?php the_title(); ?></h1>
				<div class="isg-body" style="margin-top: 2.4rem;">
					<?php the_content(); ?>
				</div>
			</article>
		<?php endwhile; ?>
	</div>
</main>
<?php
get_footer();

