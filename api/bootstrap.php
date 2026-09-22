<?php
/**
 * Bootstrap for AutoKlic PHP API.
 * Loads config from outside webroot when possible.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

// CORS for same-origin SPA is not required; allow simple preflight if needed
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    http_response_code(204);
    exit;
}

$configCandidates = [];
if (getenv('APP_CONFIG_PATH')) {
    $configCandidates[] = getenv('APP_CONFIG_PATH');
}
// Sibling of public_html (typical cPanel layout when api lives in public_html/api)
$configCandidates[] = dirname(__DIR__, 2) . '/autoklic-config.php';
$configCandidates[] = dirname(__DIR__) . '/../autoklic-config.php';
// Local/dev fallback inside repo (never commit real secrets)
$configCandidates[] = dirname(__DIR__) . '/config/config.local.php';
$configCandidates[] = dirname(__DIR__) . '/config/config.example.php';

$config = null;
foreach ($configCandidates as $path) {
    if ($path && is_readable($path)) {
        $config = require $path;
        break;
    }
}

if (!is_array($config)) {
    http_response_code(500);
    echo json_encode(['error' => 'Configuración no encontrada. Copia config/config.example.php fuera del webroot.']);
    exit;
}

require_once __DIR__ . '/lib/Response.php';
require_once __DIR__ . '/lib/Database.php';
require_once __DIR__ . '/lib/Auth.php';
require_once __DIR__ . '/lib/Helpers.php';

try {
    $pdo = Database::connect($config['db']);
} catch (Throwable $e) {
    Response::error('Error de conexión a la base de datos', 500);
}

$auth = new Auth($pdo, $config);
