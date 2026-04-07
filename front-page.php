<?php
/**
 * Front page template.
 *
 * @package ISG
 */

get_header();
get_template_part('template-parts/site-logo');
get_template_part('template-parts/site-header');
?>
<main id="isg-main">
	<?php get_template_part('template-parts/sections/hero'); ?>
	<?php get_template_part('template-parts/sections/application'); ?>
	<?php get_template_part('template-parts/sections/digits'); ?>
	<?php get_template_part('template-parts/sections/product-range'); ?>
	<?php get_template_part('template-parts/sections/quality'); ?>
	<?php get_template_part('template-parts/sections/about'); ?>
	<?php get_template_part('template-parts/sections/rfq'); ?>
	<?php get_template_part('template-parts/sections/footer'); ?>
</main>
<?php
get_footer();
