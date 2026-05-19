<?php
/**
 * ACF local field groups.
 *
 * @package ISG
 */

if (!defined('ABSPATH')) {
	exit;
}

function isg_acf_json_path(): string {
	return isg_theme_path('acf-json');
}

function isg_acf_save_json_path(string $path): string {
	$json_path = isg_acf_json_path();

	if (!is_dir($json_path)) {
		wp_mkdir_p($json_path);
	}

	return $json_path;
}
add_filter('acf/settings/save_json', 'isg_acf_save_json_path');

function isg_acf_load_json_paths(array $paths): array {
	$paths[] = isg_acf_json_path();
	return $paths;
}
add_filter('acf/settings/load_json', 'isg_acf_load_json_paths');

function isg_acf_image_field(string $key, string $label, string $name): array {
	return array(
		'key'           => $key,
		'label'         => $label,
		'name'          => $name,
		'type'          => 'image',
		'return_format' => 'array',
		'preview_size'  => 'medium',
		'library'       => 'all',
	);
}

function isg_acf_logo_field(string $key, string $label, string $name): array {
	return array_merge(
		isg_acf_file_field($key, $label, $name),
		array(
			'mime_types' => 'svg,png,jpg,jpeg,webp',
		)
	);
}

function isg_acf_svg_file_field(string $key, string $label, string $name): array {
	return array_merge(
		isg_acf_file_field($key, $label, $name),
		array(
			'mime_types' => 'svg',
		)
	);
}

function isg_acf_text_field(string $key, string $label, string $name, string $default = ''): array {
	return array(
		'key'           => $key,
		'label'         => $label,
		'name'          => $name,
		'type'          => 'text',
		'default_value' => $default,
	);
}

function isg_acf_true_false_field(string $key, string $label, string $name, bool $default = false): array {
	return array(
		'key'           => $key,
		'label'         => $label,
		'name'          => $name,
		'type'          => 'true_false',
		'default_value' => $default ? 1 : 0,
		'ui'            => 1,
		'ui_on_text'    => 'On',
		'ui_off_text'   => 'Off',
	);
}

function isg_acf_color_field(string $key, string $label, string $name, string $default = '#000000'): array {
	return array(
		'key'           => $key,
		'label'         => $label,
		'name'          => $name,
		'type'          => 'color_picker',
		'default_value' => $default,
	);
}

function isg_acf_textarea_field(
	string $key,
	string $label,
	string $name,
	string $default = '',
	string $new_lines = 'br'
): array {
	return array(
		'key'           => $key,
		'label'         => $label,
		'name'          => $name,
		'type'          => 'textarea',
		'default_value' => $default,
		'new_lines'     => $new_lines,
	);
}

function isg_acf_file_field(string $key, string $label, string $name): array {
	return array(
		'key'           => $key,
		'label'         => $label,
		'name'          => $name,
		'type'          => 'file',
		'return_format' => 'array',
		'library'       => 'all',
	);
}

function isg_acf_page_link_field(string $key, string $label, string $name): array {
	return array(
		'key'            => $key,
		'label'          => $label,
		'name'           => $name,
		'type'           => 'page_link',
		'post_type'      => array('page'),
		'allow_archives' => 0,
		'allow_null'     => 1,
		'multiple'       => 0,
	);
}

function isg_register_acf_fields(): void {
	if (!function_exists('acf_add_local_field_group')) {
		return;
	}

	$theme_options_locations = array(
	);

	if (function_exists('acf_add_options_page')) {
		$language_slugs = function_exists('pll_languages_list')
			? pll_languages_list(array('fields' => 'slug'))
			: array();

		if (is_array($language_slugs) && !empty($language_slugs)) {
			acf_add_options_page(
				array(
					'page_title' => 'ISG Theme Settings',
					'menu_title' => 'ISG Theme',
					'menu_slug'  => 'isg-theme-settings',
					'capability' => 'edit_theme_options',
					'redirect'   => true,
				)
			);

			foreach ($language_slugs as $language_slug) {
				$language_slug = strtolower(trim((string) $language_slug));
				if ($language_slug === '') {
					continue;
				}

				$subpage_slug = 'isg-theme-settings-' . $language_slug;

				acf_add_options_sub_page(
					array(
						'page_title'  => sprintf('ISG Theme Settings (%s)', strtoupper($language_slug)),
						'menu_title'  => strtoupper($language_slug),
						'menu_slug'   => $subpage_slug,
						'parent_slug' => 'isg-theme-settings',
						'capability'  => 'edit_theme_options',
						'post_id'     => 'options_' . $language_slug,
					)
				);

				$theme_options_locations[] = array(
					array(
						'param'    => 'options_page',
						'operator' => '==',
						'value'    => $subpage_slug,
					),
				);
			}
		}

		if (empty($theme_options_locations)) {
			acf_add_options_page(
				array(
					'page_title' => 'ISG Theme Settings',
					'menu_title' => 'ISG Theme',
					'menu_slug'  => 'isg-theme-settings',
					'capability' => 'edit_theme_options',
					'redirect'   => false,
				)
			);

			$theme_options_locations[] = array(
				array(
					'param'    => 'options_page',
					'operator' => '==',
					'value'    => 'isg-theme-settings',
				),
			);
		}
	}

	acf_add_local_field_group(
		array(
			'key'    => 'group_isg_theme_options',
			'title'  => 'ISG Theme Options',
			'fields' => array(
				array(
					'key'   => 'field_isg_tab_header',
					'label' => 'Header',
					'name'  => '',
					'type'  => 'tab',
				),
				isg_acf_logo_field('field_isg_header_logo', 'Header Logo', 'header_logo'),
				isg_acf_logo_field('field_isg_header_mobile_logo', 'Mobile Header Logo', 'header_mobile_logo'),
				array_merge(
					isg_acf_svg_file_field('field_isg_header_eu_logo', 'Header EU Logo', 'header_eu_logo'),
					array(
						'instructions' => 'Optional per language. If empty for this language, the EU logo is not shown in the header.',
					)
				),
				array_merge(
					isg_acf_page_link_field('field_isg_header_eu_logo_page_link', 'Header EU Logo Page Link', 'header_eu_logo_page_link'),
					array(
						'instructions' => 'Optional per language. Select the page opened by the header EU logo. If empty for this language, the EU logo is not shown in the header.',
					)
				),
				array(
					'key'          => 'field_isg_header_nav_items',
					'label'        => 'Header Navigation Items',
					'name'         => 'header_nav_items',
					'type'         => 'repeater',
					'layout'       => 'table',
					'button_label' => 'Add Item',
					'sub_fields'   => array(
						isg_acf_text_field('field_isg_header_nav_label', 'Label', 'label'),
						isg_acf_text_field('field_isg_header_nav_anchor', 'Anchor', 'anchor', '#isg-hero'),
					),
				),
				isg_acf_text_field('field_isg_header_contact_line_1', 'Header Contact Line 1', 'header_contact_line_1', 'Mon-Fri | 8:00-16:00'),
				isg_acf_text_field('field_isg_header_contact_line_2', 'Header Contact Line 2', 'header_contact_line_2', 'Phone | +48 881 560 845'),
				isg_acf_text_field('field_isg_header_rfq_label', 'Header RFQ Label', 'header_rfq_label', 'Send RFQ'),
				isg_acf_text_field('field_isg_header_rfq_link', 'Header RFQ Link', 'header_rfq_link', '#isg-rfq-content'),
				array(
					'key'          => 'field_isg_header_languages',
					'label'        => 'Languages',
					'name'         => 'header_languages',
					'type'         => 'repeater',
					'layout'       => 'table',
					'button_label' => 'Add Language',
					'sub_fields'   => array(
						isg_acf_text_field('field_isg_header_language_code', 'Language Code', 'code', 'EN'),
					),
				),
				array(
					'key'   => 'field_isg_tab_footer',
					'label' => 'Footer',
					'name'  => '',
					'type'  => 'tab',
				),
				isg_acf_logo_field('field_isg_footer_logo', 'Footer Logo', 'footer_logo'),
				array_merge(
					isg_acf_logo_field('field_isg_footer_mobile_logo', 'Mobile Footer Logo', 'footer_mobile_logo'),
					array(
						'instructions' => 'Used on screens up to 1099px. If empty, Footer Logo will be used.',
					)
				),
				array_merge(
					isg_acf_svg_file_field('field_isg_footer_eu_logo', 'Footer EU Logo', 'footer_eu_logo'),
					array(
						'instructions' => 'Optional per language. If empty for this language, the EU logo is not shown in the footer.',
					)
				),
				array_merge(
					isg_acf_page_link_field('field_isg_footer_eu_logo_page_link', 'Footer EU Logo Page Link', 'footer_eu_logo_page_link'),
					array(
						'instructions' => 'Optional per language. Select the page opened by the footer EU logo. If empty for this language, the EU logo is not shown in the footer.',
					)
				),
				isg_acf_text_field('field_isg_footer_label_production', 'Footer Label: Production', 'footer_label_production', 'Production'),
				isg_acf_text_field('field_isg_footer_label_office', 'Footer Label: Office', 'footer_label_office', 'Office in Warsaw'),
				isg_acf_text_field('field_isg_footer_label_hours', 'Footer Label: Working hours', 'footer_label_working_hours', 'Working hours'),
				isg_acf_text_field('field_isg_footer_label_phone', 'Footer Label: Phone', 'footer_label_phone', 'Phone'),
				isg_acf_text_field('field_isg_footer_label_email', 'Footer Label: Email', 'footer_label_email', 'Email'),
				isg_acf_textarea_field('field_isg_footer_production_address', 'Production Address', 'footer_production_address', "Sucharskiego 49\n97-500 Radomsko, Poland"),
				array(
					'key'   => 'field_isg_footer_production_map_url',
					'label' => 'Production Map URL',
					'name'  => 'footer_production_map_url',
					'type'  => 'url',
				),
				isg_acf_textarea_field('field_isg_footer_warsaw_address', 'Warsaw Office Address', 'footer_warsaw_address', "al. Wyscigowa 6\n02-681 Warsaw, Poland"),
				array(
					'key'   => 'field_isg_footer_warsaw_map_url',
					'label' => 'Warsaw Office Map URL',
					'name'  => 'footer_warsaw_map_url',
					'type'  => 'url',
				),
				isg_acf_text_field('field_isg_footer_working_hours', 'Working Hours', 'footer_working_hours', 'MON-FRI | 8:00 AM - 4:00 PM'),
				isg_acf_text_field('field_isg_footer_phone', 'Footer Phone', 'footer_phone', '+48 881 560 845'),
				isg_acf_text_field('field_isg_footer_email', 'Footer Email', 'footer_email', 'office@isg-poland.com'),
				array(
					'key'   => 'field_isg_footer_linkedin_url',
					'label' => 'LinkedIn URL',
					'name'  => 'footer_linkedin_url',
					'type'  => 'url',
				),
				array(
					'key'   => 'field_isg_footer_facebook_url',
					'label' => 'Facebook URL',
					'name'  => 'footer_facebook_url',
					'type'  => 'url',
				),
				array(
					'key'   => 'field_isg_footer_privacy_url',
					'label' => 'Privacy Policy URL',
					'name'  => 'footer_privacy_url',
					'type'  => 'url',
				),
				isg_acf_text_field('field_isg_footer_privacy_label', 'Privacy Policy Label', 'footer_privacy_label', 'Privacy Policy'),
				array(
					'key'   => 'field_isg_footer_terms_url',
					'label' => 'Terms URL',
					'name'  => 'footer_terms_url',
					'type'  => 'url',
				),
				isg_acf_text_field('field_isg_footer_terms_label', 'Terms Label', 'footer_terms_label', 'Terms of use'),
				isg_acf_text_field('field_isg_footer_copyright', 'Copyright Text', 'footer_copyright', 'Industrial Steel Group (ISG) (c) 2026'),
				isg_acf_text_field('field_isg_footer_credit_text', 'Credit Text', 'footer_credit_text', 'made in'),
				array(
					'key'   => 'field_isg_footer_credit_url',
					'label' => 'Credit URL',
					'name'  => 'footer_credit_url',
					'type'  => 'url',
				),
				array(
					'key'   => 'field_isg_tab_404',
					'label' => '404 Page',
					'name'  => '',
					'type'  => 'tab',
				),
				isg_acf_image_field('field_isg_404_background_image', '404 Background Image', '404_background_image'),
				isg_acf_text_field('field_isg_404_kicker', '404 Kicker', '404_kicker', 'error'),
				isg_acf_text_field('field_isg_404_code', '404 Code', '404_code', '404'),
				isg_acf_textarea_field('field_isg_404_title', '404 Title', '404_title', "Sorry, we didn't find the page you were looking for.", 'br'),
				isg_acf_text_field('field_isg_404_button_label', '404 Button Label', '404_button_label', 'Back to home'),
				array(
					'key'   => 'field_isg_404_button_url',
					'label' => '404 Button URL',
					'name'  => '404_button_url',
					'type'  => 'url',
				),
				isg_acf_text_field('field_isg_404_location_label', '404 Location Label', '404_location_label', 'Location'),
				isg_acf_textarea_field('field_isg_404_location', '404 Location Text', '404_location', "49 Sucharskiego Street\n97-500 Radomsko, Poland"),
				isg_acf_text_field('field_isg_404_phone_label', '404 Phone Label', '404_phone_label', 'Phone'),
				isg_acf_text_field('field_isg_404_phone', '404 Phone', '404_phone', '+48 881 560 845'),
				isg_acf_text_field('field_isg_404_email_label', '404 Email Label', '404_email_label', 'Email'),
				isg_acf_text_field('field_isg_404_email', '404 Email', '404_email', 'office@isg-poland.com'),
			),
			'location' => $theme_options_locations,
			'active' => true,
		)
	);

	acf_add_local_field_group(
		array(
			'key'    => 'group_isg_front_page',
			'title'  => 'ISG Front Page',
			'fields' => array(
				array(
					'key'   => 'field_isg_tab_hero',
					'label' => 'Hero',
					'name'  => '',
					'type'  => 'tab',
				),
				isg_acf_textarea_field('field_isg_hero_title', 'Hero Title', 'hero_title', "Large-Diameter\nSpiral-Welded Pipes"),
				isg_acf_text_field('field_isg_hero_subtitle', 'Hero Subtitle', 'hero_subtitle', 'Infrastructure & industrial projects'),
				array_merge(
					isg_acf_file_field('field_isg_hero_video_file', 'Hero Video File', 'hero_video_file'),
					array(
						'instructions' => 'Preferred source for the hero video. If empty, Hero Video URL will be used.',
						'mime_types'   => 'mp4,webm,ogg',
					)
				),
				array(
					'key'   => 'field_isg_hero_video_url',
					'label' => 'Hero Video URL',
					'name'  => 'hero_video_url',
					'type'  => 'url',
				),
				isg_acf_image_field('field_isg_hero_video_poster', 'Hero Video Poster', 'hero_video_poster'),
				isg_acf_text_field('field_isg_hero_catalog_label', 'Hero Catalogue Button Label', 'hero_catalog_label', 'Download catalogue'),
				array(
					'key'   => 'field_isg_hero_catalog_url',
					'label' => 'Hero Catalogue Button URL',
					'name'  => 'hero_catalog_url',
					'type'  => 'url',
				),
				isg_acf_text_field('field_isg_hero_watch_label', 'Hero Watch Button Label', 'hero_watch_label', 'Watch video'),
				array(
					'key'   => 'field_isg_hero_lightbox_url',
					'label' => 'Hero Lightbox Video URL',
					'name'  => 'hero_lightbox_url',
					'type'  => 'url',
				),
				array(
					'key'   => 'field_isg_tab_application',
					'label' => 'Application',
					'name'  => '',
					'type'  => 'tab',
				),
				array(
					'key'        => 'field_isg_application_section',
					'label'      => 'Application Section',
					'name'       => 'application_section',
					'type'       => 'group',
					'layout'     => 'block',
					'instructions' => 'Controls the video application section with mobile fallback and accordion items.',
					'sub_fields' => array(
						array_merge(
							isg_acf_text_field('field_isg_app_intro_kicker', 'Intro Kicker', 'intro_kicker', 'Application Areas'),
							array(
								'instructions' => 'Small label above the heading.',
							)
						),
						array_merge(
							isg_acf_textarea_field('field_isg_app_intro_title', 'Intro Title', 'intro_title', 'Spiral-welded pipes are used in various industries, such as:'),
							array(
								'instructions' => 'Main title shown in the animated desktop scene and static mobile layout.',
								'required'     => 1,
							)
						),
						isg_acf_textarea_field('field_isg_app_final_heading', 'Final Frame Heading', 'final_heading', 'Application areas for large-diameter spiral-welded pipes'),
						array_merge(
							isg_acf_file_field('field_isg_app_video_file', 'Video File', 'video_file'),
							array(
								'instructions' => 'Preferred source for the desktop video. If empty, Video URL fallback will be used.',
								'mime_types'   => 'mp4,webm,ogg',
							)
						),
						array(
							'key'   => 'field_isg_app_video_url',
							'label' => 'Video URL (fallback)',
							'name'  => 'video_url',
							'type'  => 'url',
							'instructions' => 'Optional fallback when no video file is uploaded.',
						),
						array_merge(
							isg_acf_image_field('field_isg_app_video_poster', 'Video Poster', 'video_poster'),
							array(
								'instructions' => 'Poster image shown before the video loads.',
							)
						),
						array_merge(
							isg_acf_image_field('field_isg_app_mobile_bg_image', 'Mobile Background Image', 'mobile_bg_image'),
							array(
								'instructions' => 'Static background used on mobile instead of animated video.',
							)
						),
						array(
							'key'          => 'field_isg_app_items',
							'label'        => 'Accordion Items',
							'name'         => 'items',
							'type'         => 'repeater',
							'layout'       => 'block',
							'min'          => 1,
							'collapsed'    => 'field_isg_app_item_title',
							'button_label' => 'Add Accordion Item',
							'instructions' => 'Accordion entries for the section. The first item is used as the default open state on mobile.',
							'sub_fields'   => array(
								array_merge(
									isg_acf_image_field('field_isg_app_item_icon', 'Icon', 'icon'),
									array(
										'instructions' => 'Small icon displayed in the tab.',
									)
								),
								array_merge(
									isg_acf_text_field('field_isg_app_item_title', 'Title', 'title'),
									array(
										'required' => 1,
									)
								),
								array_merge(
									isg_acf_image_field('field_isg_app_item_image', 'Image', 'image'),
									array(
										'instructions' => 'Main image inside the expanded accordion panel.',
									)
								),
								array_merge(
									isg_acf_textarea_field('field_isg_app_item_hint', 'Image Caption', 'hint'),
									array(
										'instructions' => 'Optional helper text on the image.',
									)
								),
								array_merge(
									isg_acf_text_field('field_isg_app_item_desc', 'Description', 'description'),
									array(
										'instructions' => 'Short text shown above the image in the open state.',
										'required'     => 1,
									)
								),
							),
						),
					),
				),
				array(
					'key'   => 'field_isg_tab_digits',
					'label' => 'Advantages',
					'name'  => '',
					'type'  => 'tab',
				),
				array(
					'key'        => 'field_isg_digits_section',
					'label'      => 'Advantages Section',
					'name'       => 'digits_section',
					'type'       => 'group',
					'layout'     => 'block',
					'sub_fields' => array(
						isg_acf_image_field('field_isg_digits_bg', 'Background Image', 'background_image'),
						isg_acf_text_field('field_isg_digits_title', 'Section Title', 'title', 'Advantages'),
						array(
							'key'          => 'field_isg_digits_cards',
							'label'        => 'Cards',
							'name'         => 'cards',
							'type'         => 'repeater',
							'layout'       => 'table',
							'button_label' => 'Add Card',
							'sub_fields'   => array(
								isg_acf_image_field('field_isg_digits_card_image', 'Card Image', 'image'),
								array_merge(
									isg_acf_image_field('field_isg_digits_card_icon', 'SVG Icon', 'icon'),
									array(
										'instructions' => 'Optional icon shown above the value.',
										'mime_types'   => 'svg',
									)
								),
								isg_acf_text_field('field_isg_digits_card_value', 'Value', 'value'),
								isg_acf_text_field('field_isg_digits_card_label', 'Label', 'label'),
							),
						),
					),
				),
				array(
					'key'   => 'field_isg_tab_product',
					'label' => 'Product Range',
					'name'  => '',
					'type'  => 'tab',
				),
				array(
					'key'        => 'field_isg_product_section',
					'label'      => 'Product Range Section',
					'name'       => 'product_section',
					'type'       => 'group',
					'layout'     => 'block',
					'sub_fields' => array(
						isg_acf_image_field('field_isg_product_intro_bg', 'Intro Background', 'intro_background'),
						isg_acf_image_field('field_isg_product_intro_mobile_bg', 'Mobile Intro Background', 'intro_mobile_background'),
						isg_acf_true_false_field('field_isg_product_intro_overlay_enabled', 'Intro Dark Overlay', 'intro_overlay_enabled', true),
						isg_acf_color_field('field_isg_product_intro_overlay_color_start', 'Intro Overlay Color: Top', 'intro_overlay_color_start', '#000000'),
						isg_acf_color_field('field_isg_product_intro_overlay_color_mid', 'Intro Overlay Color: Middle', 'intro_overlay_color_mid', '#000000'),
						isg_acf_color_field('field_isg_product_intro_overlay_color_end', 'Intro Overlay Color: Bottom', 'intro_overlay_color_end', '#000000'),
						isg_acf_text_field('field_isg_product_intro_kicker', 'Intro Kicker', 'intro_kicker', 'PRODUCT RANGE'),
						isg_acf_textarea_field('field_isg_product_intro_title', 'Intro Title', 'intro_title', 'We produce spiral-welded pipes in a wide range'),
						array(
							'key'          => 'field_isg_product_spec_cards',
							'label'        => 'Spec Cards',
							'name'         => 'spec_cards',
							'type'         => 'repeater',
							'layout'       => 'table',
							'button_label' => 'Add Spec Card',
							'sub_fields'   => array(
								isg_acf_text_field('field_isg_product_spec_label', 'Label', 'label'),
								isg_acf_text_field('field_isg_product_spec_value', 'Value', 'value'),
								isg_acf_text_field('field_isg_product_spec_meta', 'Meta', 'meta'),
							),
						),
						isg_acf_text_field('field_isg_product_content_kicker', 'Content Kicker', 'content_kicker', 'our position'),
						isg_acf_textarea_field('field_isg_product_content_heading', 'Content Heading', 'content_heading', 'We use high-quality steel grades in accordance with international standards and project requirements'),
						isg_acf_text_field('field_isg_product_grades_intro', 'Grades Intro', 'grades_intro', 'Typical steel grades include:'),
						isg_acf_text_field('field_isg_product_structural_label', 'Structural Label', 'structural_label', 'Structural:'),
						array(
							'key'          => 'field_isg_product_structural_items',
							'label'        => 'Structural Items',
							'name'         => 'structural_items',
							'type'         => 'repeater',
							'layout'       => 'table',
							'button_label' => 'Add Item',
							'sub_fields'   => array(
								isg_acf_text_field('field_isg_product_structural_item_text', 'Text', 'text'),
							),
						),
						isg_acf_text_field('field_isg_product_pressure_label', 'Pressure Label', 'pressure_label', 'Pressure:'),
						array(
							'key'          => 'field_isg_product_pressure_items',
							'label'        => 'Pressure Items',
							'name'         => 'pressure_items',
							'type'         => 'repeater',
							'layout'       => 'table',
							'button_label' => 'Add Item',
							'sub_fields'   => array(
								isg_acf_text_field('field_isg_product_pressure_item_text', 'Text', 'text'),
							),
						),
						isg_acf_text_field('field_isg_product_pipeline_label', 'Pipeline Label', 'pipeline_label', 'Pipeline:'),
						array(
							'key'          => 'field_isg_product_pipeline_items',
							'label'        => 'Pipeline Items',
							'name'         => 'pipeline_items',
							'type'         => 'repeater',
							'layout'       => 'table',
							'button_label' => 'Add Item',
							'sub_fields'   => array(
								isg_acf_text_field('field_isg_product_pipeline_item_text', 'Text', 'text'),
							),
						),
						isg_acf_text_field('field_isg_product_sizes_lead', 'Sizes Lead Text', 'sizes_lead', 'We produce spiral-welded steel pipes in the following size range:'),
						isg_acf_text_field('field_isg_product_sizes_head_left', 'Size Header Left', 'sizes_head_left', 'Outside diameter (mm)'),
						isg_acf_text_field('field_isg_product_sizes_head_right', 'Size Header Right', 'sizes_head_right', 'Wall thickness (mm)'),
						array(
							'key'          => 'field_isg_product_size_rows_left',
							'label'        => 'Size Rows Left Table',
							'name'         => 'size_rows_left',
							'type'         => 'repeater',
							'layout'       => 'table',
							'button_label' => 'Add Row',
							'sub_fields'   => array(
								isg_acf_text_field('field_isg_product_size_row_left_diameter', 'Outside Diameter', 'left'),
								isg_acf_text_field('field_isg_product_size_row_left_thickness', 'Wall Thickness', 'right'),
							),
						),
						array(
							'key'          => 'field_isg_product_size_rows_right',
							'label'        => 'Size Rows Right Table',
							'name'         => 'size_rows_right',
							'type'         => 'repeater',
							'layout'       => 'table',
							'button_label' => 'Add Row',
							'sub_fields'   => array(
								isg_acf_text_field('field_isg_product_size_row_right_diameter', 'Outside Diameter', 'left'),
								isg_acf_text_field('field_isg_product_size_row_right_thickness', 'Wall Thickness', 'right'),
							),
						),
					),
				),
				array(
					'key'   => 'field_isg_tab_quality',
					'label' => 'Quality',
					'name'  => '',
					'type'  => 'tab',
				),
				array(
					'key'        => 'field_isg_quality_section',
					'label'      => 'Quality Section',
					'name'       => 'quality_section',
					'type'       => 'group',
					'layout'     => 'block',
					'sub_fields' => array(
						isg_acf_image_field('field_isg_quality_intro_bg', 'Intro Background', 'intro_background'),
						isg_acf_image_field('field_isg_quality_intro_mobile_bg', 'Mobile Intro Background', 'intro_mobile_background'),
						isg_acf_true_false_field('field_isg_quality_intro_overlay_enabled', 'Intro Dark Overlay', 'intro_overlay_enabled', true),
						isg_acf_color_field('field_isg_quality_intro_overlay_color_start', 'Intro Overlay Color: Top', 'intro_overlay_color_start', '#000000'),
						isg_acf_color_field('field_isg_quality_intro_overlay_color_mid', 'Intro Overlay Color: Middle', 'intro_overlay_color_mid', '#000000'),
						isg_acf_color_field('field_isg_quality_intro_overlay_color_end', 'Intro Overlay Color: Bottom', 'intro_overlay_color_end', '#000000'),
						isg_acf_text_field('field_isg_quality_intro_kicker', 'Intro Kicker', 'intro_kicker', 'PRODUCT RANGE'),
						isg_acf_textarea_field('field_isg_quality_intro_title', 'Intro Title', 'intro_title', 'Quality control is an essential part of the production process'),
						isg_acf_text_field('field_isg_quality_focus_kicker', 'Focus Kicker', 'focus_kicker', 'Focus areas'),
						isg_acf_textarea_field('field_isg_quality_focus_heading', 'Focus Heading', 'focus_heading', 'Quality control focus areas cover every stage from production to final delivery'),
						isg_acf_text_field('field_isg_quality_skip_label', 'Skip Label', 'skip_label', 'Skip'),
						array(
							'key'          => 'field_isg_quality_items',
							'label'        => 'Quality Items',
							'name'         => 'items',
							'type'         => 'repeater',
							'layout'       => 'block',
							'button_label' => 'Add Item',
							'sub_fields'   => array(
								isg_acf_text_field('field_isg_quality_item_title', 'Title', 'title'),
								isg_acf_image_field('field_isg_quality_item_image', 'Image', 'image'),
								isg_acf_image_field('field_isg_quality_item_icon', 'Icon', 'icon'),
								isg_acf_textarea_field('field_isg_quality_item_body', 'Body', 'body'),
							),
						),
					),
				),
				array(
					'key'   => 'field_isg_tab_about',
					'label' => 'About',
					'name'  => '',
					'type'  => 'tab',
				),
				array(
					'key'        => 'field_isg_about_section',
					'label'      => 'About Section',
					'name'       => 'about_section',
					'type'       => 'group',
					'layout'     => 'block',
					'sub_fields' => array(
						isg_acf_image_field('field_isg_about_intro_bg', 'Intro Background', 'intro_background'),
						isg_acf_image_field('field_isg_about_intro_mobile_bg', 'Mobile Intro Background', 'intro_mobile_background'),
						isg_acf_true_false_field('field_isg_about_intro_overlay_enabled', 'Intro Dark Overlay', 'intro_overlay_enabled', true),
						isg_acf_color_field('field_isg_about_intro_overlay_color_start', 'Intro Overlay Color: Top', 'intro_overlay_color_start', '#000000'),
						isg_acf_color_field('field_isg_about_intro_overlay_color_mid', 'Intro Overlay Color: Middle', 'intro_overlay_color_mid', '#000000'),
						isg_acf_color_field('field_isg_about_intro_overlay_color_end', 'Intro Overlay Color: Bottom', 'intro_overlay_color_end', '#000000'),
						isg_acf_text_field('field_isg_about_intro_kicker', 'Intro Kicker', 'intro_kicker', 'PRODUCT RANGE'),
						isg_acf_textarea_field('field_isg_about_intro_title', 'Intro Title', 'intro_title', 'ISG modern spiral-welded pipe production with reliable quality and competitive service'),
						isg_acf_text_field('field_isg_about_text_kicker', 'Text Grid Kicker', 'textgrid_kicker', 'our position'),
						isg_acf_textarea_field('field_isg_about_text_left', 'Text Grid Left', 'textgrid_left'),
						isg_acf_textarea_field('field_isg_about_text_heading', 'Text Grid Heading', 'textgrid_heading'),
						isg_acf_textarea_field('field_isg_about_text_lead', 'Text Grid Lead', 'textgrid_lead'),
						isg_acf_text_field('field_isg_about_values_kicker', 'Values Kicker', 'values_kicker', 'PRODUCT RANGE'),
						isg_acf_text_field('field_isg_about_values_skip_label', 'Values Skip Label', 'values_skip_label', 'Skip'),
						array(
							'key'          => 'field_isg_about_values_items',
							'label'        => 'Values Items',
							'name'         => 'values_items',
							'type'         => 'repeater',
							'layout'       => 'block',
							'button_label' => 'Add Value Item',
							'sub_fields'   => array(
								isg_acf_text_field('field_isg_about_values_item_title', 'Title', 'title'),
								isg_acf_image_field('field_isg_about_values_item_image', 'Image', 'image'),
								isg_acf_image_field('field_isg_about_values_item_icon', 'Icon', 'icon'),
								isg_acf_textarea_field('field_isg_about_values_item_body', 'Body', 'body'),
							),
						),
						isg_acf_text_field('field_isg_about_team_kicker', 'Team Kicker', 'team_kicker', 'our position'),
						isg_acf_textarea_field('field_isg_about_team_heading', 'Team Heading', 'team_heading'),
						isg_acf_textarea_field('field_isg_about_team_lead', 'Team Lead', 'team_lead'),
						array(
							'key'          => 'field_isg_about_team_slides',
							'label'        => 'Team Slides',
							'name'         => 'team_slides',
							'type'         => 'repeater',
							'layout'       => 'table',
							'button_label' => 'Add Team Slide',
							'sub_fields'   => array(
								isg_acf_image_field('field_isg_about_team_slide_image', 'Image', 'image'),
								isg_acf_text_field('field_isg_about_team_slide_name', 'Name', 'name'),
								isg_acf_text_field('field_isg_about_team_slide_role', 'Role', 'role'),
							),
						),
						isg_acf_text_field('field_isg_about_certs_lead', 'Certificates Lead', 'certs_lead'),
						array(
							'key'          => 'field_isg_about_cert_badges',
							'label'        => 'Certificate Badges',
							'name'         => 'cert_badges',
							'type'         => 'repeater',
							'layout'       => 'table',
							'button_label' => 'Add Certificate',
							'sub_fields'   => array(
								isg_acf_text_field('field_isg_about_cert_badge_label', 'Label', 'label'),
								isg_acf_image_field('field_isg_about_cert_badge_image', 'Certificate Image', 'image'),
							),
						),
						isg_acf_text_field('field_isg_about_gallery_kicker', 'Gallery Kicker', 'gallery_kicker', 'Gallery'),
						isg_acf_textarea_field('field_isg_about_gallery_heading', 'Gallery Heading', 'gallery_heading'),
						array(
							'key'          => 'field_isg_about_gallery_slides',
							'label'        => 'Gallery Slides',
							'name'         => 'gallery_slides',
							'type'         => 'repeater',
							'layout'       => 'table',
							'button_label' => 'Add Gallery Slide',
							'sub_fields'   => array(
								isg_acf_image_field('field_isg_about_gallery_slide_image', 'Image', 'image'),
							),
						),
					),
				),
				array(
					'key'   => 'field_isg_tab_rfq',
					'label' => 'RFQ',
					'name'  => '',
					'type'  => 'tab',
				),
				array(
					'key'        => 'field_isg_rfq_section',
					'label'      => 'RFQ Section',
					'name'       => 'rfq_section',
					'type'       => 'group',
					'layout'     => 'block',
					'sub_fields' => array(
						isg_acf_image_field('field_isg_rfq_intro_bg', 'Intro Background', 'intro_background'),
						isg_acf_image_field('field_isg_rfq_intro_mobile_bg', 'Mobile Intro Background', 'intro_mobile_background'),
						isg_acf_true_false_field('field_isg_rfq_intro_overlay_enabled', 'Intro Dark Overlay', 'intro_overlay_enabled', true),
						isg_acf_color_field('field_isg_rfq_intro_overlay_color_start', 'Intro Overlay Color: Top', 'intro_overlay_color_start', '#000000'),
						isg_acf_color_field('field_isg_rfq_intro_overlay_color_mid', 'Intro Overlay Color: Middle', 'intro_overlay_color_mid', '#000000'),
						isg_acf_color_field('field_isg_rfq_intro_overlay_color_end', 'Intro Overlay Color: Bottom', 'intro_overlay_color_end', '#000000'),
						isg_acf_text_field('field_isg_rfq_intro_kicker', 'Intro Kicker', 'intro_kicker', 'ENGINEERING & CUSTOM ORDERS'),
						isg_acf_textarea_field('field_isg_rfq_intro_title', 'Intro Title', 'intro_title'),
						isg_acf_textarea_field('field_isg_rfq_intro_body', 'Intro Body', 'intro_body'),
						isg_acf_text_field('field_isg_rfq_intro_cta_label', 'Intro CTA Label', 'intro_cta_label', 'Download catalogue'),
						array(
							'key'   => 'field_isg_rfq_intro_cta_url',
							'label' => 'Intro CTA URL',
							'name'  => 'intro_cta_url',
							'type'  => 'url',
						),
						isg_acf_text_field('field_isg_rfq_aside_kicker', 'Aside Kicker', 'aside_kicker', 'RFQ'),
						isg_acf_textarea_field('field_isg_rfq_aside_title_accent', 'Aside Title Accent', 'aside_title_accent'),
						isg_acf_textarea_field('field_isg_rfq_aside_title_text', 'Aside Title Text', 'aside_title_text'),
						isg_acf_text_field('field_isg_rfq_aside_heading', 'Aside Heading', 'aside_heading', 'Request a quotation'),
						array(
							'key'           => 'field_isg_rfq_cf7_shortcode',
							'label'         => 'Contact Form 7 Shortcode',
							'name'          => 'cf7_shortcode',
							'type'          => 'text',
							'instructions'  => 'Optional. Paste the Contact Form 7 shortcode here to replace the built-in RFQ form without changing the layout.',
							'placeholder'   => '[contact-form-7 id="123" title="ISG RFQ"]',
						),
					),
				),
			),
			'location' => array(
				array(
					array(
						'param'    => 'page_type',
						'operator' => '==',
						'value'    => 'front_page',
					),
				),
			),
			'active' => true,
		)
	);
}
add_action('acf/init', 'isg_register_acf_fields', 5);

/**
 * Fast seed defaults for initial launch.
 */
function isg_seed_acf_defaults(): void {
	if (!function_exists('update_field') || !function_exists('get_field')) {
		return;
	}

	$seeded = get_option('isg_acf_seeded_v1');
	if ($seeded) {
		return;
	}

	if (!get_field('header_nav_items', 'option')) {
		update_field(
			'header_nav_items',
			array(
				array('label' => 'Products', 'anchor' => '#isg-product'),
				array('label' => 'Applications', 'anchor' => '#isg-application'),
				array('label' => 'Production', 'anchor' => '#isg-quality'),
				array('label' => 'Certificates', 'anchor' => '#isg-about'),
			),
			'option'
		);
	}

	if (!get_field('header_languages', 'option')) {
		update_field(
			'header_languages',
			array(
				array('code' => 'EN'),
				array('code' => 'PL'),
				array('code' => 'DE'),
			),
			'option'
		);
	}

	update_option('isg_acf_seeded_v1', 1);
}
add_action('acf/init', 'isg_seed_acf_defaults', 20);
