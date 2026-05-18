<?php
/**
 * Hero section.
 *
 * @package ISG
 */

$default_video = 'https://res.cloudinary.com/dfuh3h6e5/video/upload/v1774773307/hero-video_cwxqya.mp4';
$page_id       = get_the_ID();

$is_empty_media_value = static function ($value): bool {
	if (is_array($value)) {
		return empty($value['url']) && empty($value['ID']) && empty($value['id']);
	}
	if (is_numeric($value)) {
		return (int) $value <= 0;
	}
	return trim((string) $value) === '';
};

$hero_media = array(
	'video_file'   => function_exists('get_field') ? get_field('hero_video_file', $page_id) : '',
	'video_url'    => function_exists('get_field') ? get_field('hero_video_url', $page_id) : '',
	'video_poster' => function_exists('get_field') ? get_field('hero_video_poster', $page_id) : '',
);

if (function_exists('pll_default_language') && function_exists('pll_get_post')) {
	$default_lang    = (string) pll_default_language('slug');
	$default_page_id = $default_lang !== '' ? (int) pll_get_post((int) $page_id, $default_lang) : 0;
	if ($default_page_id > 0 && $default_page_id !== (int) $page_id && function_exists('get_field')) {
		$default_media = array(
			'video_file'   => get_field('hero_video_file', $default_page_id),
			'video_url'    => get_field('hero_video_url', $default_page_id),
			'video_poster' => get_field('hero_video_poster', $default_page_id),
		);
		foreach (array('video_file', 'video_url', 'video_poster') as $media_key) {
			if (
				$is_empty_media_value($hero_media[$media_key] ?? '')
				&& !$is_empty_media_value($default_media[$media_key] ?? '')
			) {
				$hero_media[$media_key] = $default_media[$media_key];
			}
		}
	}
}

$video_file    = $hero_media['video_file'] ?? '';
$video_url     = is_string($hero_media['video_url'] ?? '') || is_numeric($hero_media['video_url'] ?? '')
	? (string) $hero_media['video_url']
	: '';
$poster_source = $hero_media['video_poster'] ?? '';
$poster_url    = isg_image_url($poster_source, isg_asset_uri('img/img-test-1.jpg'));
$video_size    = isg_image_dimensions($poster_source, 1920, 1080);

if (is_array($video_file) && !empty($video_file['url']) && is_string($video_file['url'])) {
	$video_url = $video_file['url'];
} elseif (is_numeric($video_file)) {
	$video_file_url = wp_get_attachment_url((int) $video_file);
	if (is_string($video_file_url) && $video_file_url !== '') {
		$video_url = $video_file_url;
	}
}

if ($video_url === '') {
	$video_url = $default_video;
}

$video_url = isg_absolute_url($video_url, $default_video);

$lightbox_url = (string) isg_acf_value('hero_lightbox_url', $video_url, $page_id);
$lightbox_kind = preg_match('~(?:youtube\.com|youtu\.be|vimeo\.com)~i', $lightbox_url) ? 'embed' : 'video';

$title        = (string) isg_acf_value('hero_title', "Large-Diameter\nSpiral-Welded Pipes", $page_id);
$subtitle     = (string) isg_acf_value('hero_subtitle', 'Infrastructure & industrial projects', $page_id);
$catalog_text = (string) isg_acf_value('hero_catalog_label', 'Download catalogue', $page_id);
$catalog_url  = (string) isg_acf_value('hero_catalog_url', '#', $page_id);
$watch_text   = (string) isg_acf_value('hero_watch_label', 'Watch video', $page_id);
?>
<section id="isg-hero" class="isg-hero" data-isg-block="hero" aria-label="Hero">
	<div class="isg-hero__video" aria-hidden="true">
		<video class="isg-hero__video-media" autoplay muted loop playsinline webkit-playsinline preload="auto" width="<?php echo esc_attr((string) $video_size['width']); ?>" height="<?php echo esc_attr((string) $video_size['height']); ?>" poster="<?php echo esc_url($poster_url); ?>">
			<source src="<?php echo esc_url($video_url); ?>" type="video/mp4" />
		</video>
	</div>

	<div class="isg-hero__conteiner container">
		<div class="isg-hero__content">
			<div class="isg-title-group">
				<h1 class="isg-display isg-text-center isg-hero__title"><?php echo wp_kses_post(isg_format_text_with_breaks($title)); ?></h1>
				<p class="isg-lead isg-text-center isg-hero__lead"><?php echo esc_html($subtitle); ?></p>
			</div>

			<div class="isg-btn-group isg-btn-group--spread isg-btn-group--hero-actions">
				<a class="isg-btn isg-btn--blur" href="<?php echo esc_url($catalog_url); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html($catalog_text); ?></a>
				<button
					type="button"
					class="isg-hero-watch-btn"
					data-isg-lightbox="<?php echo esc_attr($lightbox_url); ?>"
					data-isg-lightbox-kind="<?php echo esc_attr($lightbox_kind); ?>"
					aria-label="<?php echo esc_attr($watch_text); ?>"
				>
					<span class="isg-hero-watch-btn__thumb" aria-hidden="true">
						<video class="isg-hero-watch-btn__preview" muted loop playsinline webkit-playsinline autoplay preload="metadata" width="<?php echo esc_attr((string) $video_size['width']); ?>" height="<?php echo esc_attr((string) $video_size['height']); ?>" poster="<?php echo esc_url($poster_url); ?>">
							<source src="<?php echo esc_url($video_url); ?>" type="video/mp4" />
						</video>
						<span class="isg-hero-watch-btn__play">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
								<path d="M9 7.5v9l7.5-4.5L9 7.5z" fill="currentColor" />
							</svg>
						</span>
					</span>
					<span class="isg-hero-watch-btn__label"><?php echo esc_html($watch_text); ?></span>
				</button>
			</div>
		</div>
	</div>
</section>

