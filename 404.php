<?php
/**
 * 404 template.
 *
 * @package ISG
 */

get_header();

$background_image = isg_acf_image_url('404_background_image', 'option', isg_asset_uri('img/engenereeng-intro.jpg'));
$kicker = (string) isg_acf_option('404_kicker', 'error');
$code = (string) isg_acf_option('404_code', '404');
$title = (string) isg_acf_option('404_title', "Sorry, we didn't find the page you were looking for.");
$button_label = (string) isg_acf_option('404_button_label', 'Back to home');
$button_url = (string) isg_acf_option('404_button_url', isg_front_page_url());
$location_label = (string) isg_acf_option('404_location_label', 'Location');
$location_text = (string) isg_acf_option('404_location', "49 Sucharskiego Street\n97-500 Radomsko, Poland");
$phone_label = (string) isg_acf_option('404_phone_label', 'Phone');
$phone = (string) isg_acf_option('404_phone', '+48 881 560 845');
$email_label = (string) isg_acf_option('404_email_label', 'Email');
$email = (string) isg_acf_option('404_email', 'office@isg-poland.com');

$footer_logo = isg_acf_image_url('footer_logo', 'option', isg_asset_uri('img/logo_footer.svg'));
$footer_logo_size = isg_acf_image_dimensions('footer_logo', 'option', 167, 23);
$linkedin_url = (string) isg_acf_option('footer_linkedin_url', 'https://www.linkedin.com/company/industrial-steel-group/?viewAsMember=true');
$facebook_url = (string) isg_acf_option('footer_facebook_url', 'https://www.facebook.com/');
$privacy_url = (string) isg_acf_option('footer_privacy_url', '#');
$privacy_label_text = (string) isg_acf_option('footer_privacy_label', 'Privacy Policy');
$terms_url = (string) isg_acf_option('footer_terms_url', '#');
$terms_label_text = (string) isg_acf_option('footer_terms_label', 'Terms of use');
$copyright_text = (string) isg_acf_option('footer_copyright', 'Industrial Steel Group (ISG) © 2026');

$phone_href = preg_replace('/[^\d+]/', '', $phone);
$hero_style = sprintf(
	"background: linear-gradient(180deg, rgba(15, 10, 10, 0.42) 0%%, rgba(15, 10, 10, 0.38) 100%%), radial-gradient(circle at center, rgba(255, 215, 164, 0.12) 0%%, rgba(20, 13, 13, 0) 30%%), url('%s') center center / cover no-repeat;",
	esc_url($background_image)
);
?>
<main class="isg-404" aria-labelledby="isg-404-title" style="<?php echo esc_attr($hero_style); ?>">
	<div class="isg-404__inner">
		<section class="isg-404__hero">
			<div class="isg-404__hero-inner">
				<div class="isg-subtitle">
					<p class="isg-subtitle__text"><?php echo esc_html($kicker); ?></p>
					<span class="isg-subtitle__swatch" aria-hidden="true"></span>
				</div>
				<p class="isg-404__code"><?php echo esc_html($code); ?></p>
				<h1 id="isg-404-title" class="isg-404__title">
					<?php echo wp_kses_post(isg_format_text_with_breaks($title)); ?></h1>
				<div class="isg-404__actions">
					<a class="isg-404__button isg-btn isg-btn--blur"
						href="<?php echo esc_url($button_url ?: isg_front_page_url()); ?>">
						<?php echo esc_html($button_label); ?>
					</a>
				</div>
			</div>
		</section>

		<footer class="isg-404__footer container">
			<div class="isg-404__contacts">
				<div class="isg-404__contact">
					<p class="isg-footer__label"><?php echo esc_html($location_label); ?>:</p>
					<p class="isg-404__contact-value isg-footer__value isg-footer__link">
						<?php echo wp_kses_post(isg_format_text_with_breaks($location_text)); ?>
					</p>
				</div>
				<div class="isg-404__contact isg-404__contact--center">
					<p class="isg-404__contact-label isg-footer__label"><?php echo esc_html($phone_label); ?>:</p>
					<p class="isg-404__contact-value isg-footer__value isg-footer__link">
						<a href="<?php echo esc_url('tel:' . $phone_href); ?>"><?php echo esc_html($phone); ?></a>
					</p>
				</div>
				<div class="isg-404__contact isg-404__contact--right">
					<p class="isg-404__contact-label isg-footer__label"><?php echo esc_html($email_label); ?>:</p>
					<p class="isg-404__contact-value isg-footer__value isg-footer__link">
						<a href="<?php echo esc_url('mailto:' . $email); ?>"><?php echo esc_html($email); ?></a>
					</p>
				</div>
			</div>

			<div class="isg-404__bottom">
				<a class="isg-404__logo" href="<?php echo esc_url(isg_front_page_url()); ?>"
					aria-label="<?php esc_attr_e('ISG home', 'isg'); ?>">
					<img src="<?php echo esc_url($footer_logo); ?>" alt="ISG" width="<?php echo esc_attr((string) $footer_logo_size['width']); ?>" height="<?php echo esc_attr((string) $footer_logo_size['height']); ?>" loading="lazy"
						decoding="async" />
				</a>

				<div class="isg-404__social" aria-label="<?php esc_attr_e('Social links', 'isg'); ?>">
					<a class="isg-404__social-link" href="<?php echo esc_url($facebook_url); ?>" aria-label="Facebook"
						target="_blank" rel="noopener noreferrer">
						<svg class="isg-404__social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path
								d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
						</svg>
					</a>
					<a class="isg-404__social-link" href="<?php echo esc_url($linkedin_url); ?>" aria-label="LinkedIn"
						target="_blank" rel="noopener noreferrer">
						<svg class="isg-404__social-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
							<path
								d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
						</svg>
					</a>
				</div>

				<div class="isg-404__legal">
					<div class="isg-footer__legal">
						<a href="<?php echo esc_url($privacy_url); ?>"><?php echo esc_html($privacy_label_text); ?></a>
						<span aria-hidden="true">|</span>
						<a href="<?php echo esc_url($terms_url); ?>"><?php echo esc_html($terms_label_text); ?></a>
					</div>
					<p class="isg-footer__copy"><?php echo esc_html($copyright_text); ?></p>
				</div>
			</div>
		</footer>
	</div>
</main>
<?php
get_footer();
