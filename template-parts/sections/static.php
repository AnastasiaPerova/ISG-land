<?php
/**
 * Render static partial from /partials for fast migration.
 *
 * @package ISG
 */

if (empty($args['file'])) {
	return;
}

isg_render_static_partial((string) $args['file']);

