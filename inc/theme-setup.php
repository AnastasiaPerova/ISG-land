<?php
/**
 * Theme setup.
 *
 * @package ISG
 */

if (!defined('ABSPATH')) {
	exit;
}

function isg_theme_setup(): void {
	add_theme_support('title-tag');
	add_theme_support('post-thumbnails');
	add_theme_support('menus');
	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
		)
	);

	register_nav_menus(
		array(
			'header_menu' => __('Header Menu', 'isg'),
			'footer_menu' => __('Footer Menu', 'isg'),
		)
	);
}
add_action('after_setup_theme', 'isg_theme_setup');

function isg_can_upload_svg(): bool {
	return current_user_can('upload_files');
}

function isg_allow_svg_uploads(array $mimes): array {
	if (!isg_can_upload_svg()) {
		return $mimes;
	}

	$mimes['svg'] = 'image/svg+xml';

	return $mimes;
}
add_filter('upload_mimes', 'isg_allow_svg_uploads');

function isg_check_svg_filetype(array $data, string $file, string $filename, array $mimes): array {
	unset($mimes);

	if (!isg_can_upload_svg() || strtolower(pathinfo($filename, PATHINFO_EXTENSION)) !== 'svg') {
		return $data;
	}

	$contents = is_readable($file) ? file_get_contents($file) : false;
	if (!is_string($contents) || !preg_match('/<svg[\s>]/i', $contents)) {
		return $data;
	}

	$data['ext']             = 'svg';
	$data['type']            = 'image/svg+xml';
	$data['proper_filename'] = false;

	return $data;
}
add_filter('wp_check_filetype_and_ext', 'isg_check_svg_filetype', 10, 4);

function isg_fix_svg_upload_data(array $upload): array {
	$file = isset($upload['file']) ? (string) $upload['file'] : '';
	if ($file !== '' && isg_is_svg_file($file)) {
		$upload['type'] = 'image/svg+xml';
	}

	return $upload;
}
add_filter('wp_handle_upload', 'isg_fix_svg_upload_data');

function isg_is_svg_file(string $file): bool {
	return strtolower(pathinfo($file, PATHINFO_EXTENSION)) === 'svg';
}

function isg_is_svg_attachment(int $attachment_id): bool {
	return get_post_mime_type($attachment_id) === 'image/svg+xml';
}

function isg_disable_svg_big_image_threshold($threshold, $imagesize = array(), string $file = '', int $attachment_id = 0) {
	unset($imagesize);

	if (($file !== '' && isg_is_svg_file($file)) || ($attachment_id > 0 && isg_is_svg_attachment($attachment_id))) {
		return false;
	}

	return $threshold;
}
add_filter('big_image_size_threshold', 'isg_disable_svg_big_image_threshold', 10, 4);

function isg_svg_is_not_displayable_image(bool $result, string $path = ''): bool {
	if ($path !== '' && isg_is_svg_file($path)) {
		return false;
	}

	return $result;
}
add_filter('file_is_displayable_image', 'isg_svg_is_not_displayable_image', 10, 2);

function isg_disable_svg_intermediate_sizes(array $sizes, $metadata = array(), int $attachment_id = 0): array {
	unset($metadata);

	if ($attachment_id > 0 && isg_is_svg_attachment($attachment_id)) {
		return array();
	}

	return $sizes;
}
add_filter('intermediate_image_sizes_advanced', 'isg_disable_svg_intermediate_sizes', 10, 3);

function isg_disable_svg_missing_image_subsizes(array $missing_sizes, $image_meta = array(), int $attachment_id = 0): array {
	unset($image_meta);

	if (isg_is_svg_attachment($attachment_id)) {
		return array();
	}

	return $missing_sizes;
}
add_filter('wp_get_missing_image_subsizes', 'isg_disable_svg_missing_image_subsizes', 10, 3);

function isg_extract_svg_dimensions(string $file): array {
	if (!is_readable($file)) {
		return array(0, 0);
	}

	$contents = file_get_contents($file, false, null, 0, 4096);
	if (!is_string($contents)) {
		return array(0, 0);
	}

	$width = 0;
	$height = 0;

	if (preg_match('/\bwidth=["\']?([0-9.]+)/i', $contents, $width_match)) {
		$width = (int) round((float) $width_match[1]);
	}
	if (preg_match('/\bheight=["\']?([0-9.]+)/i', $contents, $height_match)) {
		$height = (int) round((float) $height_match[1]);
	}

	if (($width <= 0 || $height <= 0) && preg_match('/\bviewBox=["\']\s*[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)/i', $contents, $viewbox_match)) {
		$width = $width > 0 ? $width : (int) round((float) $viewbox_match[1]);
		$height = $height > 0 ? $height : (int) round((float) $viewbox_match[2]);
	}

	return array(max(1, $width), max(1, $height));
}

function isg_svg_attachment_metadata($metadata, int $attachment_id) {
	if (!isg_is_svg_attachment($attachment_id)) {
		return $metadata;
	}

	$file = get_attached_file($attachment_id);
	if (!is_string($file) || $file === '') {
		return $metadata;
	}

	list($width, $height) = isg_extract_svg_dimensions($file);
	$relative_file = function_exists('_wp_relative_upload_path') ? _wp_relative_upload_path($file) : basename($file);

	return array(
		'width'  => $width,
		'height' => $height,
		'file'   => $relative_file,
		'sizes'  => array(),
	);
}
add_filter('wp_generate_attachment_metadata', 'isg_svg_attachment_metadata', 10, 2);

function isg_prepare_svg_attachment_for_js(array $response, WP_Post $attachment, $meta = array()): array {
	unset($meta);

	if (get_post_mime_type($attachment) !== 'image/svg+xml') {
		return $response;
	}

	$url = wp_get_attachment_url($attachment->ID);
	if (!$url) {
		return $response;
	}

	$file = get_attached_file($attachment->ID);
	list($width, $height) = is_string($file) ? isg_extract_svg_dimensions($file) : array(1, 1);

	$response['image'] = array(
		'src'    => $url,
		'width'  => $width,
		'height' => $height,
	);
	$response['sizes'] = array(
		'full' => array(
			'url'         => $url,
			'width'       => $width,
			'height'      => $height,
			'orientation' => $width >= $height ? 'landscape' : 'portrait',
		),
	);
	$response['icon'] = $url;

	return $response;
}
add_filter('wp_prepare_attachment_for_js', 'isg_prepare_svg_attachment_for_js', 10, 3);

function isg_body_classes(array $classes): array {
	$classes[] = 'isg-wp-theme';
	$classes[] = 'isg-preloader-active';

	if (is_404()) {
		$classes[] = 'isg-404-page';
	}

	return $classes;
}
add_filter('body_class', 'isg_body_classes');

