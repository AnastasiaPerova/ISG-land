<?php
/**
 * Hero section.
 *
 * @package ISG
 */

$default_video = 'https://res.cloudinary.com/dfuh3h6e5/video/upload/v1774773307/hero-video_cwxqya.mp4';
$page_id       = get_the_ID();
$video_file    = get_field('hero_video_file', $page_id);
$video_url     = (string) isg_acf_value('hero_video_url', $default_video, $page_id);
$poster_url    = isg_acf_image_url('hero_video_poster', (string) get_the_ID(), isg_asset_uri('img/img-test-1.jpg'));

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
		<video class="isg-hero__video-media" autoplay muted loop playsinline poster="<?php echo esc_url($poster_url); ?>">
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
						<video class="isg-hero-watch-btn__preview" muted loop playsinline autoplay preload="metadata" poster="<?php echo esc_url($poster_url); ?>">
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

