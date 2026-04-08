<?php
/**
 * RFQ form submission handler.
 *
 * Uses wp_mail(), so WP Mail SMTP can route delivery.
 *
 * @package ISG
 */

if (!defined('ABSPATH')) {
	exit;
}

add_action('admin_post_nopriv_isg_submit_rfq', 'isg_handle_rfq_form_submit');
add_action('admin_post_isg_submit_rfq', 'isg_handle_rfq_form_submit');

/**
 * Build redirect URL with status code and anchor.
 *
 * @param string $status Status slug.
 * @return string
 */
function isg_rfq_redirect_with_status(string $status): string {
	$ref = wp_get_referer();
	if (!is_string($ref) || $ref === '') {
		$ref = home_url('/');
	}

	$base = remove_query_arg(array('isg_rfq_status', 'isg_rfq_error'), $ref);
	$url  = add_query_arg(
		array(
			'isg_rfq_status' => $status,
		),
		$base
	);

	return $url . '#isg-rfq-content';
}

/**
 * Handle RFQ form post.
 *
 * @return void
 */
function isg_handle_rfq_form_submit(): void {
	if (!isset($_POST['isg_rfq_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['isg_rfq_nonce'])), 'isg_submit_rfq')) {
		wp_safe_redirect(isg_rfq_redirect_with_status('security'));
		exit;
	}

	$company        = sanitize_text_field(wp_unslash($_POST['company'] ?? ''));
	$email          = sanitize_email(wp_unslash($_POST['email'] ?? ''));
	$phone          = sanitize_text_field(wp_unslash($_POST['phone'] ?? ''));
	$project_type   = sanitize_text_field(wp_unslash($_POST['project_type'] ?? ''));
	$diameter       = sanitize_text_field(wp_unslash($_POST['diameter'] ?? ''));
	$wall_thickness = sanitize_text_field(wp_unslash($_POST['wall_thickness'] ?? ''));
	$steel_grade    = sanitize_text_field(wp_unslash($_POST['steel_grade'] ?? ''));
	$quantity       = sanitize_text_field(wp_unslash($_POST['quantity'] ?? ''));
	$delivery       = sanitize_text_field(wp_unslash($_POST['delivery'] ?? ''));
	$message        = sanitize_textarea_field(wp_unslash($_POST['message'] ?? ''));
	$terms          = sanitize_text_field(wp_unslash($_POST['terms'] ?? ''));

	if (!is_email($email) || $phone === '' || $diameter === '' || $wall_thickness === '' || $steel_grade === '' || $terms !== '1') {
		wp_safe_redirect(isg_rfq_redirect_with_status('invalid'));
		exit;
	}

	$to = apply_filters('isg_rfq_mail_to', get_option('admin_email'));

	$subject_name = $company !== '' ? $company : $email;
	$subject      = sprintf('RFQ request from %s', $subject_name);

	$lines   = array();
	$lines[] = 'New RFQ request';
	$lines[] = '-------------------------';
	$lines[] = sprintf('Company: %s', $company !== '' ? $company : '-');
	$lines[] = sprintf('Email: %s', $email);
	$lines[] = sprintf('Phone: %s', $phone);
	$lines[] = sprintf('Project type: %s', $project_type !== '' ? $project_type : '-');
	$lines[] = sprintf('Pipe diameter: %s', $diameter);
	$lines[] = sprintf('Wall thickness: %s', $wall_thickness);
	$lines[] = sprintf('Steel grade: %s', $steel_grade);
	$lines[] = sprintf('Quantity: %s', $quantity !== '' ? $quantity : '-');
	$lines[] = sprintf('Delivery: %s', $delivery !== '' ? $delivery : '-');
	$lines[] = '';
	$lines[] = 'Message:';
	$lines[] = $message !== '' ? $message : '-';

	$body = implode("\n", $lines);

	$headers = array(
		'Content-Type: text/plain; charset=UTF-8',
		sprintf('Reply-To: %s', $email),
	);

	$sent = wp_mail($to, $subject, $body, $headers);

	wp_safe_redirect(isg_rfq_redirect_with_status($sent ? 'success' : 'error'));
	exit;
}

