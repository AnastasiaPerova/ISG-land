<?php
/**
 * Footer section.
 *
 * @package ISG
 */

$footer_logo = isg_acf_image_url('footer_logo', 'option', isg_asset_uri('img/logo_footer.svg'));

$production_address = (string) isg_acf_option('footer_production_address', "Sucharskiego 49\n97-500 Radomsko, Poland");
$production_map_url = (string) isg_acf_option('footer_production_map_url', 'https://www.google.com/maps/search/?api=1&query=Sucharskiego+49+97-500+Radomsko+Poland');

$warsaw_address = (string) isg_acf_option('footer_warsaw_address', "al. Wyścigowa 6\n02-681 Warsaw, Poland");
$warsaw_map_url = (string) isg_acf_option('footer_warsaw_map_url', 'https://www.google.com/maps/search/?api=1&query=al.+Wy%C5%9Bcigowa+6+02-681+Warsaw+Poland');

$working_hours = (string) isg_acf_option('footer_working_hours', 'MON–FRI | 8:00 AM – 4:00 PM');
$phone         = (string) isg_acf_option('footer_phone', '+48 881 560 845');
$email         = (string) isg_acf_option('footer_email', 'office@isg-poland.com');

$linkedin_url = (string) isg_acf_option('footer_linkedin_url', 'https://www.linkedin.com/company/industrial-steel-group/?viewAsMember=true');
$facebook_url = (string) isg_acf_option('footer_facebook_url', 'https://www.facebook.com/');

$privacy_url = (string) isg_acf_option('footer_privacy_url', '#');
$terms_url   = (string) isg_acf_option('footer_terms_url', '#');

$copyright_text = (string) isg_acf_option('footer_copyright', 'Industrial Steel Group (ISG) © 2026');
$credit_text    = (string) isg_acf_option('footer_credit_text', 'made in');
$credit_url     = (string) isg_acf_option('footer_credit_url', 'https://bafa.agency');
$credit_label   = parse_url($credit_url, PHP_URL_HOST) ?: 'bafa.agency';

$label_production   = (string) isg_acf_option('footer_label_production', 'Production');
$label_office       = (string) isg_acf_option('footer_label_office', 'Office in Warsaw');
$label_hours        = (string) isg_acf_option('footer_label_working_hours', 'Working hours');
$label_phone        = (string) isg_acf_option('footer_label_phone', 'Phone');
$label_email        = (string) isg_acf_option('footer_label_email', 'Email');
$privacy_label_text = (string) isg_acf_option('footer_privacy_label', 'Privacy Policy');
$terms_label_text   = (string) isg_acf_option('footer_terms_label', 'Terms of use');

$phone_href = preg_replace('/[^\d+]/', '', $phone);
?>
<div class="isg-footer-spacer" data-isg-footer-spacer aria-hidden="true"></div>
<footer id="isg-footer" class="isg-footer isg-footer--reveal" data-isg-block="footer">
	<div class="isg-footer__inner container">
		<div class="isg-footer__row isg-footer__row--locations">
			<div class="isg-footer__col">
				<div class="isg-footer__label"><?php echo esc_html($label_production); ?></div>
				<a class="isg-footer__value isg-footer__link" href="<?php echo esc_url($production_map_url); ?>" target="_blank" rel="noopener noreferrer">
					<?php echo wp_kses_post(nl2br(esc_html($production_address))); ?>
				</a>
			</div>
			<div class="isg-footer__col">
				<div class="isg-footer__label"><?php echo esc_html($label_office); ?></div>
				<a class="isg-footer__value isg-footer__link" href="<?php echo esc_url($warsaw_map_url); ?>" target="_blank" rel="noopener noreferrer">
					<?php echo wp_kses_post(nl2br(esc_html($warsaw_address))); ?>
				</a>
			</div>
			<div class="isg-footer__col">
				<div class="isg-footer__label"><?php echo esc_html($label_hours); ?></div>
				<p class="isg-footer__value isg-footer__value--plain"><?php echo esc_html($working_hours); ?></p>
			</div>
		</div>

		<div class="isg-footer__row isg-footer__row--contact">
			<div class="isg-footer__col">
				<div class="isg-footer__label"><?php echo esc_html($label_phone); ?></div>
				<a class="isg-footer__value isg-footer__link" href="<?php echo esc_url('tel:' . $phone_href); ?>"><?php echo esc_html($phone); ?></a>
			</div>
			<div class="isg-footer__col">
				<div class="isg-footer__label"><?php echo esc_html($label_email); ?></div>
				<a class="isg-footer__value isg-footer__link" href="<?php echo esc_url('mailto:' . $email); ?>"><?php echo esc_html($email); ?></a>
			</div>
			<div class="isg-footer__col isg-footer__col--spacer" aria-hidden="true"></div>
		</div>

		<div class="isg-footer__row isg-footer__row--bottom">
			<div class="isg-footer__col isg-footer__col--logo">
				<img class="isg-footer__logo" src="<?php echo esc_url($footer_logo); ?>" alt="ISG" width="170" height="62" loading="lazy" />
			</div>

			<div class="isg-footer__col">
				<div class="isg-footer__social">
					<a class="isg-footer__social-link" href="<?php echo esc_url($linkedin_url); ?>" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
						<svg class="isg-footer__social-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
							<path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
						</svg>
					</a>
					<a class="isg-footer__social-link" href="<?php echo esc_url($facebook_url); ?>" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
						<svg class="isg-footer__social-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
							<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
						</svg>
					</a>
				</div>
			</div>

			<div class="isg-footer__col">
				<div class="isg-footer__legal">
					<a href="<?php echo esc_url($privacy_url); ?>"><?php echo esc_html($privacy_label_text); ?></a>
					<span aria-hidden="true">|</span>
					<a href="<?php echo esc_url($terms_url); ?>"><?php echo esc_html($terms_label_text); ?></a>
				</div>
				<p class="isg-footer__copy"><?php echo esc_html($copyright_text); ?></p>
				<p class="isg-footer__credit">
					<?php echo esc_html($credit_text); ?>
					<a href="<?php echo esc_url($credit_url); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html($credit_label); ?></a>
				</p>
			</div>
		</div>
	</div>

	<button type="button" class="isg-to-top" data-isg-to-top aria-label="<?php esc_attr_e('Back to top', 'isg'); ?>">
		<svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
			<path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
		</svg>
	</button>
</footer>
