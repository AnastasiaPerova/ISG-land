<?php
/**
 * Contact Form 7 helpers for RFQ form.
 *
 * @package ISG
 */

if (!defined('ABSPATH')) {
	exit;
}

/**
 * Ensure the RFQ Contact Form 7 shortcode carries the theme form class.
 *
 * @param string $shortcode Raw Contact Form 7 shortcode.
 * @return string
 */
function isg_prepare_rfq_cf7_shortcode(string $shortcode): string {
	$shortcode = trim($shortcode);
	if ($shortcode === '' || !preg_match('/^\[contact-form-7\b[^\]]*\]$/i', $shortcode)) {
		return $shortcode;
	}

	$form_class = 'isg-rfq-form';

	if (preg_match('/\bhtml_class=(["\'])(.*?)\1/i', $shortcode, $matches)) {
		$existing = preg_split('/\s+/', trim((string) $matches[2])) ?: array();
		if (!in_array($form_class, $existing, true)) {
			$existing[] = $form_class;
		}

		$replacement = 'html_class=' . $matches[1] . trim(implode(' ', array_filter($existing))) . $matches[1];
		return preg_replace('/\bhtml_class=(["\'])(.*?)\1/i', $replacement, $shortcode, 1) ?: $shortcode;
	}

	return preg_replace('/\]$/', ' html_class="' . $form_class . '"]', $shortcode, 1) ?: $shortcode;
}

/**
 * Check whether RFQ can be rendered through Contact Form 7.
 *
 * @param string $shortcode Prepared Contact Form 7 shortcode.
 * @return bool
 */
function isg_can_render_rfq_cf7(string $shortcode): bool {
	return $shortcode !== ''
		&& shortcode_exists('contact-form-7')
		&& preg_match('/^\[contact-form-7\b[^\]]*\]$/i', trim($shortcode)) === 1;
}
