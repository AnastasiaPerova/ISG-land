<?php
/**
 * Fixed logo outside header.
 *
 * @package ISG
 */

$logo_url = isg_acf_image_url('header_logo', 'option', isg_asset_uri('img/logo_footer.svg'));
$home_hero_url = isg_anchor_url('#isg-hero', '#isg-hero');
?>
<div class="isg-site-logo" data-isg-section-nav>
	<a class="isg-hero__logo-link" href="<?php echo esc_url($home_hero_url); ?>" aria-label="<?php esc_attr_e('ISG - Home', 'isg'); ?>">
		<img
			class="isg-hero__logo-img"
			src="<?php echo esc_url($logo_url); ?>"
			alt=""
			width="170"
			height="62"
			decoding="async"
		/>
	</a>
</div>
