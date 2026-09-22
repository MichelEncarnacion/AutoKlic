<?php

declare(strict_types=1);

function uuid_v4(): string
{
    $data = random_bytes(16);
    $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
    $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

function json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    if ($raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function query_param(string $key, $default = null)
{
    return $_GET[$key] ?? $default;
}

function bool_from($v): bool
{
    if (is_bool($v)) return $v;
    if (is_int($v)) return $v === 1;
    if (is_string($v)) return in_array(strtolower($v), ['1', 'true', 'yes', 'on'], true);
    return (bool) $v;
}

/** Normalize DB row for JSON API (booleans, imagenes array, numeric-ish). */
function normalize_car(?array $row): ?array
{
    if (!$row) return null;
    $imgs = $row['imagenes'] ?? '[]';
    if (is_string($imgs)) {
        $decoded = json_decode($imgs, true);
        $row['imagenes'] = is_array($decoded) ? $decoded : [];
    }
    $row['aire'] = (bool) (int) ($row['aire'] ?? 0);
    $row['visible'] = (bool) (int) ($row['visible'] ?? 0);
    if (isset($row['precio'])) $row['precio'] = (float) $row['precio'];
    if (isset($row['año'])) $row['año'] = (int) $row['año'];
    if (array_key_exists('kilometraje', $row) && $row['kilometraje'] !== null) {
        $row['kilometraje'] = (int) $row['kilometraje'];
    }
    return $row;
}

function normalize_profile(?array $row): ?array
{
    if (!$row) return null;
    if (array_key_exists('active', $row)) {
        $row['active'] = (bool) (int) $row['active'];
    }
    return $row;
}

function normalize_compra(?array $row): ?array
{
    if (!$row) return null;
    foreach (['doc_factura', 'doc_tenencia', 'doc_verificacion'] as $f) {
        if (array_key_exists($f, $row)) $row[$f] = (bool) (int) $row[$f];
    }
    if (isset($row['precio_compra'])) $row['precio_compra'] = (float) $row['precio_compra'];
    return $row;
}

function normalize_lead(?array $row): ?array
{
    if (!$row) return null;
    if (isset($row['precio_cierre']) && $row['precio_cierre'] !== null) {
        $row['precio_cierre'] = (float) $row['precio_cierre'];
    }
    return $row;
}

function ensure_upload_dir(string $base, string $relative): string
{
    $dir = rtrim($base, '/') . '/' . trim($relative, '/');
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        Response::error('No se pudo crear directorio de uploads', 500);
    }
    return $dir;
}

function public_upload_url(array $config, string $relativePath): string
{
    return rtrim($config['uploads_url'], '/') . '/' . ltrim($relativePath, '/');
}
