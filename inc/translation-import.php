<?php
/**
 * Translation payload importer for front-page content.
 *
 * @package ISG
 */

if (!defined('ABSPATH')) {
	exit;
}

function isg_translation_import_default_payload_path(): string {
	return isg_theme_path('data/acf-import/isg-site-translations.json');
}

function isg_translation_import_resolve_payload_path(string $path = ''): string {
	$path = trim($path);

	if ($path === '') {
		return isg_translation_import_default_payload_path();
	}

	if (file_exists($path)) {
		return $path;
	}

	$theme_relative = isg_theme_path(ltrim($path, '/\\'));
	if (file_exists($theme_relative)) {
		return $theme_relative;
	}

	return $path;
}

function isg_translation_import_load_payload(string $path = '') {
	$resolved_path = isg_translation_import_resolve_payload_path($path);

	if (!file_exists($resolved_path)) {
		return new WP_Error('isg_import_payload_missing', sprintf('JSON payload not found: %s', $resolved_path));
	}

	$json = file_get_contents($resolved_path);
	if ($json === false) {
		return new WP_Error('isg_import_payload_read_failed', sprintf('Failed to read JSON payload: %s', $resolved_path));
	}

	$payload = json_decode($json, true);
	if (!is_array($payload)) {
		return new WP_Error('isg_import_payload_invalid', 'Invalid JSON payload.');
	}

	$payload['_resolved_path'] = $resolved_path;

	return $payload;
}

function isg_translation_import_is_assoc(array $value): bool {
	return array_keys($value) !== range(0, count($value) - 1);
}

function isg_translation_import_normalize_acf_value($value) {
	if (!is_array($value)) {
		return $value;
	}

	if (isset($value['ID'], $value['url']) && is_numeric($value['ID'])) {
		return (int) $value['ID'];
	}

	$normalized = array();
	foreach ($value as $key => $item) {
		$normalized[$key] = isg_translation_import_normalize_acf_value($item);
	}

	return $normalized;
}

function isg_translation_import_overlay($base, $overlay) {
	if (!is_array($overlay)) {
		return $overlay;
	}

	if (!is_array($base)) {
		$base = array();
	}

	if (isg_translation_import_is_assoc($overlay)) {
		$result = $base;
		foreach ($overlay as $key => $value) {
			$result[$key] = isg_translation_import_overlay($base[$key] ?? null, $value);
		}
		return $result;
	}

	$result = array();
	foreach ($overlay as $index => $value) {
		$base_value     = array_key_exists($index, $base) ? $base[$index] : null;
		$result[$index] = isg_translation_import_overlay($base_value, $value);
	}

	return $result;
}

function isg_translation_import_find_page(string $slug, string $title): int {
	$page = get_page_by_path($slug, OBJECT, 'page');
	if ($page instanceof WP_Post) {
		return (int) $page->ID;
	}

	$page = get_page_by_title($title, OBJECT, 'page');
	if ($page instanceof WP_Post) {
		return (int) $page->ID;
	}

	return 0;
}

function isg_translation_import_upsert_page(array $post_payload, int $existing_id = 0) {
	$postarr = array(
		'post_type'    => 'page',
		'post_status'  => (string) ($post_payload['status'] ?? 'publish'),
		'post_title'   => (string) ($post_payload['title'] ?? ''),
		'post_name'    => sanitize_title((string) ($post_payload['slug'] ?? '')),
		'post_content' => '',
	);

	if ($existing_id > 0) {
		$postarr['ID'] = $existing_id;
		$result        = wp_update_post($postarr, true);
	} else {
		$result = wp_insert_post($postarr, true);
	}

	if (is_wp_error($result)) {
		return $result;
	}

	return (int) $result;
}

function isg_translation_import_run(string $path = '') {
	if (!function_exists('get_field') || !function_exists('update_field')) {
		return new WP_Error('isg_import_acf_missing', 'ACF must be active before running the importer.');
	}

	$payload = isg_translation_import_load_payload($path);
	if (is_wp_error($payload)) {
		return $payload;
	}

	$default_language = (string) ($payload['default_language'] ?? 'en');
	$translations     = $payload['front_page']['translations'] ?? array();

	if (!is_array($translations) || empty($translations[$default_language])) {
		return new WP_Error('isg_import_default_missing', 'Default-language payload is missing.');
	}

	$logs                 = array();
	$source_front_page_id = (int) get_option('page_on_front');
	$default_post_payload = is_array($translations[$default_language]['post'] ?? null) ? $translations[$default_language]['post'] : array();

	if ($source_front_page_id <= 0) {
		$source_front_page_id = isg_translation_import_find_page(
			(string) ($default_post_payload['slug'] ?? 'home'),
			(string) ($default_post_payload['title'] ?? 'Home')
		);
	}

	$source_front_page_id = isg_translation_import_upsert_page($default_post_payload, $source_front_page_id);
	if (is_wp_error($source_front_page_id)) {
		return $source_front_page_id;
	}

	update_option('show_on_front', 'page');
	update_option('page_on_front', $source_front_page_id);

	$page_ids        = array($default_language => $source_front_page_id);
	$polylang_active = function_exists('pll_set_post_language') && function_exists('pll_save_post_translations');

	if ($polylang_active) {
		pll_set_post_language($source_front_page_id, $default_language);
	}

	foreach ($translations as $language => $translation) {
		$post_payload = is_array($translation['post'] ?? null) ? $translation['post'] : array();
		$acf_overlay  = is_array($translation['acf'] ?? null) ? $translation['acf'] : array();
		$page_id      = $language === $default_language ? $source_front_page_id : 0;

		if ($language !== $default_language) {
			if ($polylang_active && function_exists('pll_get_post')) {
				$page_id = (int) pll_get_post($source_front_page_id, $language);
			}

			if ($page_id <= 0) {
				$page_id = isg_translation_import_find_page(
					(string) ($post_payload['slug'] ?? $language),
					(string) ($post_payload['title'] ?? strtoupper($language))
				);
			}

			$page_id = isg_translation_import_upsert_page($post_payload, $page_id);
			if (is_wp_error($page_id)) {
				return $page_id;
			}

			if ($polylang_active) {
				pll_set_post_language($page_id, $language);
			}

			$page_ids[$language] = $page_id;
		}

		$current_fields = get_fields($page_id);
		$current_fields = is_array($current_fields) ? isg_translation_import_normalize_acf_value($current_fields) : array();
		$merged_fields  = isg_translation_import_overlay($current_fields, $acf_overlay);

		foreach ($merged_fields as $field_name => $field_value) {
			update_field($field_name, $field_value, $page_id);
		}

		$logs[] = sprintf('Imported %s content into page #%d', strtoupper($language), $page_id);
	}

	if ($polylang_active && count($page_ids) > 1) {
		pll_save_post_translations($page_ids);
		$logs[] = 'Polylang translation set saved.';
	} elseif (!$polylang_active) {
		$logs[] = 'Polylang is not active, so translated pages were created without translation links.';
	}

	$logs[] = sprintf('Import completed using %s', $payload['_resolved_path']);

	return array(
		'payload_path' => $payload['_resolved_path'],
		'page_ids'     => $page_ids,
		'logs'         => $logs,
	);
}

function isg_translation_import_admin_menu(): void {
	add_theme_page(
		__('Translation Import', 'isg'),
		__('Translation Import', 'isg'),
		'manage_options',
		'isg-translation-import',
		'isg_translation_import_render_admin_page'
	);
}
add_action('admin_menu', 'isg_translation_import_admin_menu');

function isg_translation_import_store_result(array $result): string {
	$token = wp_generate_password(12, false, false);
	set_transient('isg_translation_import_' . $token, $result, 10 * MINUTE_IN_SECONDS);
	return $token;
}

function isg_translation_import_get_result(string $token): array {
	$result = get_transient('isg_translation_import_' . $token);
	delete_transient('isg_translation_import_' . $token);
	return is_array($result) ? $result : array();
}

function isg_translation_import_render_admin_page(): void {
	if (!current_user_can('manage_options')) {
		wp_die(esc_html__('You do not have permission to access this page.', 'isg'));
	}

	$token       = isset($_GET['isg_import_result']) ? sanitize_text_field(wp_unslash((string) $_GET['isg_import_result'])) : '';
	$import_data = $token !== '' ? isg_translation_import_get_result($token) : array();
	$json_path   = isg_translation_import_default_payload_path();
	?>
	<div class="wrap">
		<h1><?php esc_html_e('ISG Translation Import', 'isg'); ?></h1>
		<p><?php esc_html_e('Imports translated front-page ACF content from the generated JSON payload and creates or updates Polylang page translations.', 'isg'); ?></p>

		<?php if (!empty($import_data)) : ?>
			<div class="notice notice-<?php echo !empty($import_data['success']) ? 'success' : 'error'; ?> is-dismissible">
				<p>
					<?php
					echo esc_html(
						!empty($import_data['success'])
							? __('Import completed.', 'isg')
							: __('Import failed.', 'isg')
					);
					?>
				</p>
				<?php if (!empty($import_data['message'])) : ?>
					<p><?php echo esc_html((string) $import_data['message']); ?></p>
				<?php endif; ?>
				<?php if (!empty($import_data['logs']) && is_array($import_data['logs'])) : ?>
					<ul style="list-style:disc; margin-left: 20px;">
						<?php foreach ($import_data['logs'] as $log) : ?>
							<li><?php echo esc_html((string) $log); ?></li>
						<?php endforeach; ?>
					</ul>
				<?php endif; ?>
			</div>
		<?php endif; ?>

		<table class="form-table" role="presentation">
			<tbody>
				<tr>
					<th scope="row"><?php esc_html_e('Payload file', 'isg'); ?></th>
					<td><code><?php echo esc_html($json_path); ?></code></td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e('Requirements', 'isg'); ?></th>
					<td>
						<p><?php esc_html_e('ACF is required. Polylang is optional but recommended for linking EN / PL / DE pages.', 'isg'); ?></p>
					</td>
				</tr>
			</tbody>
		</table>

		<form method="post" action="<?php echo esc_url(admin_url('admin-post.php')); ?>">
			<?php wp_nonce_field('isg_translation_import_run'); ?>
			<input type="hidden" name="action" value="isg_translation_import_run" />
			<input type="hidden" name="payload_path" value="<?php echo esc_attr($json_path); ?>" />
			<?php submit_button(__('Run Import', 'isg')); ?>
		</form>
	</div>
	<?php
}

function isg_translation_import_handle_admin_post(): void {
	if (!current_user_can('manage_options')) {
		wp_die(esc_html__('You do not have permission to run this import.', 'isg'));
	}

	check_admin_referer('isg_translation_import_run');

	$payload_path = isset($_POST['payload_path']) ? sanitize_text_field(wp_unslash((string) $_POST['payload_path'])) : '';
	$result       = isg_translation_import_run($payload_path);

	if (is_wp_error($result)) {
		$stored = array(
			'success' => false,
			'message' => $result->get_error_message(),
			'logs'    => array(),
		);
	} else {
		$stored = array(
			'success' => true,
			'message' => sprintf(
				/* translators: %s: payload path */
				__('Imported translations from %s', 'isg'),
				(string) ($result['payload_path'] ?? '')
			),
			'logs'    => is_array($result['logs'] ?? null) ? $result['logs'] : array(),
		);
	}

	$token = isg_translation_import_store_result($stored);

	wp_safe_redirect(
		add_query_arg(
			array(
				'page'              => 'isg-translation-import',
				'isg_import_result' => $token,
			),
			admin_url('themes.php')
		)
	);
	exit;
}
add_action('admin_post_isg_translation_import_run', 'isg_translation_import_handle_admin_post');
