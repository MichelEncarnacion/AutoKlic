<?php
/**
 * AutoKlic config EXAMPLE — Namecheap cPanel
 * Subdomain: https://autoclik.michel-encarnacion.dev
 *
 * 1. Copy OUTSIDE the subdomain document root, e.g.:
 *      /home/YOUR_CPANEL_USER/autoklic-config.php
 * 2. Fill MySQL credentials from cPanel → MySQL® Databases.
 * 3. Set jwt_secret to a long random string.
 * 4. Set uploads_path to absolute path of DOCROOT/uploads
 *    (DOCROOT = folder cPanel assigned to the autoclik subdomain).
 */

return [
    'db' => [
        'host' => 'localhost',
        'name' => 'CHANGE_ME_DB_NAME',
        'user' => 'CHANGE_ME_DB_USER',
        'pass' => 'CHANGE_ME_DB_PASS',
        'charset' => 'utf8mb4',
    ],

    'jwt_secret' => 'CHANGE_ME_TO_A_LONG_RANDOM_STRING_32PLUS',
    'jwt_ttl_seconds' => 60 * 60 * 24 * 7,

    'site_url' => 'https://autoclik.michel-encarnacion.dev',

    // Adjust YOUR_CPANEL_USER and DOCROOT folder name from cPanel Subdomains
    'uploads_path' => '/home/CHANGE_ME_CPANEL_USER/autoclik.michel-encarnacion.dev/uploads',
    'uploads_url' => 'https://autoclik.michel-encarnacion.dev/uploads',

    'mail_from' => 'noreply@autoclik.michel-encarnacion.dev',
    'mail_from_name' => 'AutoKlic',
];
