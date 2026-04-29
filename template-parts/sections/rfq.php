<?php
/**
 * RFQ section.
 *
 * @package ISG
 */

$page_id = get_the_ID();

$default_diameter_options = array(
	array('value' => '406', 'label' => '406 mm'),
	array('value' => '508', 'label' => '508 mm'),
	array('value' => '610', 'label' => '610 mm'),
	array('value' => '762', 'label' => '762 mm'),
	array('value' => '914', 'label' => '914 mm'),
	array('value' => '1067', 'label' => '1067 mm'),
	array('value' => '1219', 'label' => '1219 mm'),
	array('value' => 'custom', 'label' => 'Custom (specify in message)'),
);

$default_wall_options = array(
	array('value' => '6', 'label' => '6 mm'),
	array('value' => '8', 'label' => '8 mm'),
	array('value' => '10', 'label' => '10 mm'),
	array('value' => '12', 'label' => '12 mm'),
	array('value' => '14', 'label' => '14 mm'),
	array('value' => '16', 'label' => '16 mm'),
	array('value' => 'custom', 'label' => 'Custom'),
);

$default_steel_options = array(
	array('value' => 's235', 'label' => 'S235 / S235JR'),
	array('value' => 's275', 'label' => 'S275 / S275J0'),
	array('value' => 's355', 'label' => 'S355 / S355J2'),
	array('value' => 'api5l-b', 'label' => 'API 5L Grade B'),
	array('value' => 'api5l-x52', 'label' => 'API 5L X52'),
	array('value' => 'api5l-x65', 'label' => 'API 5L X65'),
	array('value' => 'en10219', 'label' => 'EN 10219 S355J2H'),
	array('value' => 'custom', 'label' => 'Other / specify'),
);

$default_labels = array(
	'company'      => 'company name',
	'email'        => 'email address',
	'phone'        => 'phone number',
	'project_type' => 'project type',
	'pipe_diameter'=> 'pipe diameter',
	'wall_thickness' => 'wall thickness',
	'steel_grade'  => 'steel grade',
	'quantity'     => 'quantity',
	'delivery'     => 'delivery location',
	'message'      => 'message',
	'terms_prefix' => 'I have read and accept the',
	'terms_link'   => 'Terms & Conditions',
	'submit'       => 'Submit form',
);

$section = isg_acf_group(
	'rfq_section',
	array(
		'intro_background'  => isg_asset_uri('img/engenereeng-intro.jpg'),
		'intro_kicker'      => 'ENGINEERING & CUSTOM ORDERS',
		'intro_title'       => 'We offer flexible manufacturing tailored to project needs',
		'intro_body'        => 'Production parameters can be adapted to technical specifications, including diameter, wall thickness, steel grade, pipe length, applicable standards and documentation. Custom orders are manufactured in accordance with customer specifications.',
		'intro_cta_label'   => 'Download catalogue',
		'intro_cta_url'     => '#',
		'aside_kicker'      => 'RFQ',
		'aside_title_accent'=> 'Please send your project specifications for review.',
		'aside_title_text'  => 'Our team will assess the requirements and prepare a quotation based on the provided information',
		'aside_heading'     => 'Request a quotation',
		'form_labels'       => $default_labels,
		'cf7_shortcode'     => '',
		'terms_url'         => '#',
		'diameter_options'  => $default_diameter_options,
		'wall_options'      => $default_wall_options,
		'steel_options'     => $default_steel_options,
	),
	$page_id
);

$intro_bg       = isg_image_url($section['intro_background'] ?? '', isg_asset_uri('img/engenereeng-intro.jpg'));
$intro_kicker   = (string) ($section['intro_kicker'] ?? 'ENGINEERING & CUSTOM ORDERS');
$intro_title    = (string) ($section['intro_title'] ?? '');
$intro_body     = (string) ($section['intro_body'] ?? '');
$intro_cta_lbl  = (string) ($section['intro_cta_label'] ?? 'Download catalogue');
$intro_cta_url  = (string) ($section['intro_cta_url'] ?? '#');
$aside_kicker   = (string) ($section['aside_kicker'] ?? 'RFQ');
$aside_accent   = (string) ($section['aside_title_accent'] ?? '');
$aside_text     = (string) ($section['aside_title_text'] ?? '');
$aside_heading  = (string) ($section['aside_heading'] ?? ($section['form_heading'] ?? 'Request a quotation'));
$form_labels    = is_array($section['form_labels'] ?? null) ? $section['form_labels'] : $default_labels;
$cf7_shortcode  = isg_prepare_rfq_cf7_shortcode((string) ($section['cf7_shortcode'] ?? ''));
$terms_url      = (string) ($section['terms_url'] ?? '#');
$diameter_opts  = is_array($section['diameter_options'] ?? null) ? $section['diameter_options'] : $default_diameter_options;
$wall_opts      = is_array($section['wall_options'] ?? null) ? $section['wall_options'] : $default_wall_options;
$steel_opts     = is_array($section['steel_options'] ?? null) ? $section['steel_options'] : $default_steel_options;
$use_cf7        = isg_can_render_rfq_cf7($cf7_shortcode);
$form_action    = esc_url(admin_url('admin-post.php'));
$form_status    = isset($_GET['isg_rfq_status']) ? sanitize_key((string) wp_unslash($_GET['isg_rfq_status'])) : '';

$label = static function (array $labels, string $key, string $fallback = ''): string {
	$value = $labels[$key] ?? $fallback;
	return is_string($value) ? $value : $fallback;
};
?>
<div id="isg-rfq" class="isg-rfq-section" data-isg-block="rfq">
	<section class="isg-intro-section isg-intro-section--align-start isg-rfq-intro isg-section-surface"
		style="background-image: url('<?php echo esc_url($intro_bg); ?>');" data-isg-intro-scroll>
		<div class="isg-intro-section__container isg-rfq-intro__conteiner container">
			<div class="isg-intro-section__content isg-rfq-intro__content isg-text-light">
				<div class="isg-title-group">
					<div class="isg-subtitle">
						<p class="isg-subtitle__text"><?php echo esc_html($intro_kicker); ?></p>
						<span class="isg-subtitle__swatch" aria-hidden="true"></span>
					</div>
					<h2 class="isg-display isg-text-center"><?php echo esc_html($intro_title); ?></h2>
				</div>
				<div class="isg-rfq-intro__split">
					<p class="isg-rfq-intro__lead"><?php echo esc_html($intro_body); ?></p>
					<div class="isg-btn-group isg-btn-group--spread">
						<div class="isg-btn-group">
							<a class="isg-btn isg-btn--blur" href="<?php echo esc_url($intro_cta_url); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html($intro_cta_lbl); ?></a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<div id="isg-rfq-content" class="isg-rfq-content isg-section-surface">
		<div class="container isg-rfq-content__inner">
			<div class="isg-rfq-row">
				<aside class="isg-rfq-aside">
					<div class="isg-section-head isg-title-group isg-title-group--align-start">
						<div class="isg-section-head__subtitle isg-subtitle">
							<p class="isg-subtitle__text"><?php echo esc_html($aside_kicker); ?></p>
							<span class="isg-subtitle__swatch" aria-hidden="true"></span>
						</div>

						<?php if ($aside_heading !== '') : ?>
							<h3 class="isg-rfq-aside__heading"><?php echo esc_html($aside_heading); ?></h3>
						<?php endif; ?>

						<p class="isg-rfq-aside__text">
							<span class="isg-rfq-aside__title-accent"><?php echo esc_html($aside_accent); ?></span><br />
							<span><?php echo esc_html($aside_text); ?></span>
						</p>
					</div>
				</aside>

				<div class="isg-rfq-form-wrap">
					<?php if ($use_cf7) : ?>
						<?php echo do_shortcode($cf7_shortcode); ?>
					<?php else : ?>
						<form class="isg-rfq-form" data-isg-rfq-form method="post" action="<?php echo $form_action; ?>">
							<input type="hidden" name="action" value="isg_submit_rfq" />
							<?php wp_nonce_field('isg_submit_rfq', 'isg_rfq_nonce'); ?>
							<?php if ($form_status === 'success') : ?>
								<p class="isg-rfq-form__notice isg-rfq-form__notice--success" role="status"><?php esc_html_e('Thank you. Your request has been sent successfully.', 'isg'); ?></p>
							<?php elseif ($form_status === 'invalid') : ?>
								<p class="isg-rfq-form__notice isg-rfq-form__notice--error" role="alert"><?php esc_html_e('Please fill in all required fields correctly.', 'isg'); ?></p>
							<?php elseif ($form_status === 'security') : ?>
								<p class="isg-rfq-form__notice isg-rfq-form__notice--error" role="alert"><?php esc_html_e('Security check failed. Please try again.', 'isg'); ?></p>
							<?php elseif ($form_status === 'error') : ?>
								<p class="isg-rfq-form__notice isg-rfq-form__notice--error" role="alert"><?php esc_html_e('Message was not sent. Please try again later.', 'isg'); ?></p>
							<?php endif; ?>
							<div class="isg-rfq-inputs">
								<div class="isg-rfq-inputs-row isg-rfq-inputs-row--full">
									<label class="isg-field isg-field--float">
										<input class="isg-field__control" type="text" name="company" autocomplete="organization" placeholder=" " />
										<span class="isg-field__label"><span class="isg-field__label-text"><?php echo esc_html($label($form_labels, 'company', 'company name')); ?></span></span>
									</label>
								</div>

								<div class="isg-rfq-inputs-row">
									<label class="isg-field isg-field--float">
										<input class="isg-field__control" type="email" name="email" autocomplete="email" required placeholder=" " />
										<span class="isg-field__label"><span class="isg-field__label-text"><?php echo esc_html($label($form_labels, 'email', 'email address')); ?></span><abbr class="isg-field__req" title="required">*</abbr></span>
									</label>
									<label class="isg-field isg-field--float">
										<input class="isg-field__control" type="tel" name="phone" autocomplete="tel" required placeholder=" " />
										<span class="isg-field__label"><span class="isg-field__label-text"><?php echo esc_html($label($form_labels, 'phone', 'phone number')); ?></span><abbr class="isg-field__req" title="required">*</abbr></span>
									</label>
								</div>

								<div class="isg-rfq-inputs-row isg-rfq-inputs-row--full">
									<label class="isg-field isg-field--float">
										<input class="isg-field__control" type="text" name="project_type" placeholder=" " />
										<span class="isg-field__label"><span class="isg-field__label-text"><?php echo esc_html($label($form_labels, 'project_type', 'project type')); ?></span></span>
									</label>
								</div>

								<div class="isg-rfq-inputs-row">
									<label class="isg-field isg-field--float isg-field--select">
										<select class="isg-field__control" name="diameter" required>
											<option value="" disabled selected hidden> </option>
											<?php foreach ($diameter_opts as $opt) : ?>
												<option value="<?php echo esc_attr((string) ($opt['value'] ?? '')); ?>"><?php echo esc_html((string) ($opt['label'] ?? '')); ?></option>
											<?php endforeach; ?>
										</select>
										<span class="isg-field__label"><span class="isg-field__label-text"><?php echo esc_html($label($form_labels, 'pipe_diameter', 'pipe diameter')); ?></span></span>
									</label>
									<label class="isg-field isg-field--float isg-field--select">
										<select class="isg-field__control" name="wall_thickness" required>
											<option value="" disabled selected hidden> </option>
											<?php foreach ($wall_opts as $opt) : ?>
												<option value="<?php echo esc_attr((string) ($opt['value'] ?? '')); ?>"><?php echo esc_html((string) ($opt['label'] ?? '')); ?></option>
											<?php endforeach; ?>
										</select>
										<span class="isg-field__label"><span class="isg-field__label-text"><?php echo esc_html($label($form_labels, 'wall_thickness', 'wall thickness')); ?></span></span>
									</label>
								</div>

								<div class="isg-rfq-inputs-row">
									<label class="isg-field isg-field--float isg-field--select">
										<select class="isg-field__control" name="steel_grade" required>
											<option value="" disabled selected hidden> </option>
											<?php foreach ($steel_opts as $opt) : ?>
												<option value="<?php echo esc_attr((string) ($opt['value'] ?? '')); ?>"><?php echo esc_html((string) ($opt['label'] ?? '')); ?></option>
											<?php endforeach; ?>
										</select>
										<span class="isg-field__label"><span class="isg-field__label-text"><?php echo esc_html($label($form_labels, 'steel_grade', 'steel grade')); ?></span></span>
									</label>
									<label class="isg-field isg-field--float">
										<input class="isg-field__control" type="text" name="quantity" placeholder=" " />
										<span class="isg-field__label"><span class="isg-field__label-text"><?php echo esc_html($label($form_labels, 'quantity', 'quantity')); ?></span></span>
									</label>
								</div>

								<div class="isg-rfq-inputs-row isg-rfq-inputs-row--full">
									<label class="isg-field isg-field--float">
										<input class="isg-field__control" type="text" name="delivery" placeholder=" " />
										<span class="isg-field__label"><span class="isg-field__label-text"><?php echo esc_html($label($form_labels, 'delivery', 'delivery location')); ?></span></span>
									</label>
								</div>

								<div class="isg-rfq-inputs-row isg-rfq-inputs-row--full">
									<label class="isg-field isg-field--float isg-field--textarea">
										<textarea class="isg-field__control" name="message" rows="3" placeholder=" "></textarea>
										<span class="isg-field__label"><span class="isg-field__label-text"><?php echo esc_html($label($form_labels, 'message', 'message')); ?></span></span>
									</label>
								</div>
							</div>

							<div class="isg-checkbox-row">
								<input class="isg-checkbox" type="checkbox" name="terms" id="rfq-terms" value="1" required />
								<label class="isg-checkbox-label" for="rfq-terms">
									<?php echo esc_html($label($form_labels, 'terms_prefix', 'I have read and accept the')); ?>
									<a class="isg-checkbox-label__link" href="<?php echo esc_url($terms_url); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html($label($form_labels, 'terms_link', 'Terms & Conditions')); ?></a>.
								</label>
							</div>

							<div class="isg-btn-group">
								<button class="isg-btn" type="submit"><?php echo esc_html($label($form_labels, 'submit', 'Submit form')); ?></button>
							</div>
						</form>
					<?php endif; ?>
				</div>
			</div>
		</div>
	</div>
</div>
