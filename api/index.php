<?php

declare(strict_types=1);

require_once __DIR__ . '/bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($uri, PHP_URL_PATH) ?: '/';

// Strip /api prefix and index.php
$path = preg_replace('#^/api#', '', $path);
$path = preg_replace('#/index\.php#', '', $path);
$path = rtrim($path, '/') ?: '/';

// Legacy aliases without .php for old frontend paths
$legacyMap = [
    '/create-user' => ['POST', 'users_create'],
    '/toggle-user' => ['POST', 'users_toggle'],
    '/delete-user' => ['POST', 'users_delete'],
    '/car-price' => ['GET', 'car_price'],
];

try {
    route($method, $path, $pdo, $auth, $config, $legacyMap);
} catch (Throwable $e) {
    Response::error('Error interno: ' . $e->getMessage(), 500);
}

function route(string $method, string $path, PDO $pdo, Auth $auth, array $config, array $legacyMap): void
{
    if (isset($legacyMap[$path])) {
        [$m, $action] = $legacyMap[$path];
        if ($method !== $m) Response::error('Method not allowed', 405);
        dispatch($action, $pdo, $auth, $config);
        return;
    }

    // /auth/*
    if ($path === '/auth/login' && $method === 'POST') { dispatch('auth_login', $pdo, $auth, $config); return; }
    if ($path === '/auth/logout' && $method === 'POST') { dispatch('auth_logout', $pdo, $auth, $config); return; }
    if ($path === '/auth/me' && $method === 'GET') { dispatch('auth_me', $pdo, $auth, $config); return; }
    if ($path === '/auth/password' && $method === 'POST') { dispatch('auth_password', $pdo, $auth, $config); return; }
    if ($path === '/auth/request-reset' && $method === 'POST') { dispatch('auth_request_reset', $pdo, $auth, $config); return; }
    if ($path === '/auth/reset-password' && $method === 'POST') { dispatch('auth_reset_password', $pdo, $auth, $config); return; }

    // /cars
    if ($path === '/cars' && $method === 'GET') { dispatch('cars_list', $pdo, $auth, $config); return; }
    if ($path === '/cars' && $method === 'POST') { dispatch('cars_create', $pdo, $auth, $config); return; }
    if (preg_match('#^/cars/([^/]+)$#', $path, $m)) {
        if ($method === 'GET') { dispatch('cars_get', $pdo, $auth, $config, ['id' => $m[1]]); return; }
        if ($method === 'PUT' || $method === 'PATCH') { dispatch('cars_update', $pdo, $auth, $config, ['id' => $m[1]]); return; }
        if ($method === 'DELETE') { dispatch('cars_delete', $pdo, $auth, $config, ['id' => $m[1]]); return; }
    }

    // /leads
    if ($path === '/leads' && $method === 'GET') { dispatch('leads_list', $pdo, $auth, $config); return; }
    if ($path === '/leads' && $method === 'POST') { dispatch('leads_create', $pdo, $auth, $config); return; }
    if (preg_match('#^/leads/([^/]+)$#', $path, $m)) {
        if ($method === 'PUT' || $method === 'PATCH') { dispatch('leads_update', $pdo, $auth, $config, ['id' => $m[1]]); return; }
        if ($method === 'DELETE') { dispatch('leads_delete', $pdo, $auth, $config, ['id' => $m[1]]); return; }
    }
    if ($path === '/leads/stale-count' && $method === 'GET') { dispatch('leads_stale_count', $pdo, $auth, $config); return; }

    // /lead-events
    if ($path === '/lead-events' && $method === 'GET') { dispatch('lead_events_list', $pdo, $auth, $config); return; }
    if ($path === '/lead-events' && $method === 'POST') { dispatch('lead_events_create', $pdo, $auth, $config); return; }

    // /profiles
    if ($path === '/profiles' && $method === 'GET') { dispatch('profiles_list', $pdo, $auth, $config); return; }
    if (preg_match('#^/profiles/([^/]+)$#', $path, $m)) {
        if ($method === 'PUT' || $method === 'PATCH') { dispatch('profiles_update', $pdo, $auth, $config, ['id' => $m[1]]); return; }
    }

    // /settings
    if ($path === '/settings' && $method === 'GET') { dispatch('settings_get', $pdo, $auth, $config); return; }
    if ($path === '/settings' && $method === 'PUT') { dispatch('settings_put', $pdo, $auth, $config); return; }

    // /compras
    if ($path === '/compras' && $method === 'GET') { dispatch('compras_list', $pdo, $auth, $config); return; }
    if ($path === '/compras' && $method === 'POST') { dispatch('compras_create', $pdo, $auth, $config); return; }
    if (preg_match('#^/compras/([^/]+)$#', $path, $m)) {
        if ($method === 'PUT' || $method === 'PATCH') { dispatch('compras_update', $pdo, $auth, $config, ['id' => $m[1]]); return; }
        if ($method === 'DELETE') { dispatch('compras_delete', $pdo, $auth, $config, ['id' => $m[1]]); return; }
    }

    // /gastos-compra
    if ($path === '/gastos-compra' && $method === 'GET') { dispatch('gastos_list', $pdo, $auth, $config); return; }
    if ($path === '/gastos-compra' && $method === 'POST') { dispatch('gastos_create', $pdo, $auth, $config); return; }

    // uploads
    if ($path === '/upload/car-image' && $method === 'POST') { dispatch('upload_car_image', $pdo, $auth, $config); return; }
    if ($path === '/upload/compra-doc' && $method === 'POST') { dispatch('upload_compra_doc', $pdo, $auth, $config); return; }
    if ($path === '/upload/delete' && $method === 'POST') { dispatch('upload_delete', $pdo, $auth, $config); return; }

    // users admin (also legacy)
    if ($path === '/users' && $method === 'POST') { dispatch('users_create', $pdo, $auth, $config); return; }
    if ($path === '/users/toggle' && $method === 'POST') { dispatch('users_toggle', $pdo, $auth, $config); return; }
    if ($path === '/users/delete' && $method === 'POST') { dispatch('users_delete', $pdo, $auth, $config); return; }

    if ($path === '/car-price' && $method === 'GET') { dispatch('car_price', $pdo, $auth, $config); return; }

    if ($path === '/health' && $method === 'GET') {
        Response::ok(['ok' => true, 'stack' => 'cpanel-php-mysql']);
        return;
    }

    Response::error('Not found', 404);
}

function dispatch(string $action, PDO $pdo, Auth $auth, array $config, array $params = []): void
{
    require_once __DIR__ . '/routes/handlers.php';
    handle_action($action, $pdo, $auth, $config, $params);
}
