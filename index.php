<?php
/**
 * Fallback template.
 *
 * @package ISG
 */

get_header();
?>
<main id="isg-main" class="isg-section-surface">
	<div class="container" style="padding-top: 18rem; padding-bottom: 10rem;">
		<?php if (have_posts()) : ?>
			<?php while (have_posts()) : the_post(); ?>
				<article <?php post_class(); ?> style="margin-bottom: 4rem;">
					<h2 class="isg-h2"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
					<div class="isg-body"><?php the_excerpt(); ?></div>
				</article>
			<?php endwhile; ?>
		<?php else : ?>
			<p class="isg-body"><?php esc_html_e('No posts found.', 'isg'); ?></p>
		<?php endif; ?>
	</div>
</main>
<?php
get_footer();

