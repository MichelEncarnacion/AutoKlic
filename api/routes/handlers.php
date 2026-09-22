<?php

declare(strict_types=1);

function handle_action(string $action, PDO $pdo, Auth $auth, array $config, array $params = []): void
{
    switch ($action) {
        case 'auth_login': auth_login($pdo, $auth); break;
        case 'auth_logout': Response::ok(['ok' => true]); break;
        case 'auth_me': auth_me($auth); break;
        case 'auth_password': auth_password($pdo, $auth); break;
        case 'auth_request_reset': auth_request_reset($pdo, $config); break;
        case 'auth_reset_password': auth_reset_password($pdo); break;

        case 'cars_list': cars_list($pdo, $auth); break;
        case 'cars_get': cars_get($pdo, $params['id']); break;
        case 'cars_create': cars_create($pdo, $auth); break;
        case 'cars_update': cars_update($pdo, $auth, $params['id']); break;
        case 'cars_delete': cars_delete($pdo, $auth, $params['id']); break;

        case 'leads_list': leads_list($pdo, $auth); break;
        case 'leads_create': leads_create($pdo, $auth); break;
        case 'leads_update': leads_update($pdo, $auth, $params['id']); break;
        case 'leads_delete': leads_delete($pdo, $auth, $params['id']); break;
        case 'leads_stale_count': leads_stale_count($pdo, $auth); break;

        case 'lead_events_list': lead_events_list($pdo, $auth); break;
        case 'lead_events_create': lead_events_create($pdo, $auth); break;

        case 'profiles_list': profiles_list($pdo, $auth); break;
        case 'profiles_update': profiles_update($pdo, $auth, $params['id']); break;

        case 'settings_get': settings_get($pdo, $auth); break;
        case 'settings_put': settings_put($pdo, $auth); break;

        case 'compras_list': compras_list($pdo, $auth); break;
        case 'compras_create': compras_create($pdo, $auth); break;
        case 'compras_update': compras_update($pdo, $auth, $params['id']); break;
        case 'compras_delete': compras_delete($pdo, $auth, $params['id']); break;

        case 'gastos_list': gastos_list($pdo, $auth); break;
        case 'gastos_create': gastos_create($pdo, $auth); break;

        case 'upload_car_image': upload_car_image($pdo, $auth, $config); break;
        case 'upload_compra_doc': upload_compra_doc($pdo, $auth, $config); break;
        case 'serve_compra_doc': serve_compra_doc($auth, $config); break;
        case 'upload_delete': upload_delete($auth, $config); break;

        case 'users_create': users_create($pdo, $auth); break;
        case 'users_toggle': users_toggle($pdo, $auth); break;
        case 'users_delete': users_delete($pdo, $auth); break;

        case 'car_price': car_price(); break;

        default:
            Response::error('Unknown action', 500);
    }
}

/* ── Auth ─────────────────────────────────────────── */

function auth_login(PDO $pdo, Auth $auth): void
{
    $body = json_body();
    $email = trim((string) ($body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    if ($email === '' || $password === '') {
        Response::error('Email y contraseña son requeridos');
    }
    $stmt = $pdo->prepare(
        'SELECT u.id, u.email, u.password_hash, p.nombre, p.role, p.active
         FROM users u JOIN profiles p ON p.id = u.id WHERE u.email = ?'
    );
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    if (!$row || !password_verify($password, $row['password_hash'])) {
        Response::error('Credenciales inválidas', 401);
    }
    if (!(int) $row['active']) {
        Response::error('Usuario desactivado', 403);
    }
    $token = $auth->issueToken($row['id']);
    $profile = normalize_profile([
        'id' => $row['id'],
        'email' => $row['email'],
        'nombre' => $row['nombre'],
        'role' => $row['role'],
        'active' => $row['active'],
    ]);
    Response::ok([
        'access_token' => $token,
        'user' => ['id' => $row['id'], 'email' => $row['email']],
        'profile' => $profile,
    ]);
}

function auth_me(Auth $auth): void
{
    $user = $auth->requireUser();
    Response::ok([
        'user' => ['id' => $user['id'], 'email' => $user['email']],
        'profile' => normalize_profile($user),
    ]);
}

function auth_password(PDO $pdo, Auth $auth): void
{
    $user = $auth->requireUser();
    $body = json_body();
    $password = (string) ($body['password'] ?? '');
    if (strlen($password) < 6) {
        Response::error('La contraseña debe tener al menos 6 caracteres');
    }
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $user['id']]);
    Response::ok(['ok' => true]);
}

function auth_request_reset(PDO $pdo, array $config): void
{
    $body = json_body();
    $email = trim((string) ($body['email'] ?? ''));
    $redirectTo = (string) ($body['redirectTo'] ?? ($config['site_url'] . '/reset-password'));
    // Always return ok to avoid email enumeration
    if ($email === '') {
        Response::ok(['ok' => true]);
    }
    $stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    if (!$user) {
        Response::ok(['ok' => true]);
    }
    $token = bin2hex(random_bytes(32));
    $id = uuid_v4();
    $expires = date('Y-m-d H:i:s', time() + 3600);
    $pdo->prepare(
        'INSERT INTO password_resets (id, user_id, token, expires_at) VALUES (?,?,?,?)'
    )->execute([$id, $user['id'], $token, $expires]);

    $link = rtrim($redirectTo, '/') . (str_contains($redirectTo, '?') ? '&' : '?') . 'token=' . urlencode($token);
    $from = $config['mail_from'] ?? 'noreply@localhost';
    $fromName = $config['mail_from_name'] ?? 'AutoKlic';
    $subject = 'Restablecer contraseña — AutoKlic';
    $message = "Usa este enlace para restablecer tu contraseña (válido 1 hora):\n\n$link\n";
    $headers = "From: {$fromName} <{$from}>\r\nContent-Type: text/plain; charset=UTF-8";
    @mail($email, $subject, $message, $headers);

    // Never return reset_link in JSON — tokens must only go out via email.
    Response::ok(['ok' => true]);
}

function auth_reset_password(PDO $pdo): void
{
    $body = json_body();
    $token = (string) ($body['token'] ?? '');
    $password = (string) ($body['password'] ?? '');
    if ($token === '' || strlen($password) < 6) {
        Response::error('Token y contraseña (mín. 6) son requeridos');
    }
    $stmt = $pdo->prepare(
        'SELECT * FROM password_resets WHERE token = ? AND used_at IS NULL AND expires_at > NOW()'
    );
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    if (!$row) {
        Response::error('Enlace inválido o expirado', 400);
    }
    $hash = password_hash($password, PASSWORD_BCRYPT);
    $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$hash, $row['user_id']]);
    $pdo->prepare('UPDATE password_resets SET used_at = NOW() WHERE id = ?')->execute([$row['id']]);
    Response::ok(['ok' => true]);
}

/* ── Cars ─────────────────────────────────────────── */

function cars_list(PDO $pdo, Auth $auth): void
{
    $publicOnly = query_param('public') === '1' || query_param('visible') === '1';
    $user = $auth->bearerUser();

    $where = [];
    $args = [];

    if ($publicOnly || !$user) {
        $where[] = 'visible = 1';
    }
    if ($m = query_param('marca')) { $where[] = 'marca = ?'; $args[] = $m; }
    if ($t = query_param('transmision')) { $where[] = 'transmision = ?'; $args[] = $t; }
    if ($v = query_param('minPrecio')) { $where[] = 'precio >= ?'; $args[] = (float) $v; }
    if ($v = query_param('maxPrecio')) { $where[] = 'precio <= ?'; $args[] = (float) $v; }
    if ($v = query_param('minAño')) { $where[] = '`año` >= ?'; $args[] = (int) $v; }
    if ($v = query_param('maxAño')) { $where[] = '`año` <= ?'; $args[] = (int) $v; }
    if ($slug = query_param('modelo_slug')) {
        // match modelo slug loosely: lowercase replace spaces
        $where[] = 'LOWER(REPLACE(modelo, \' \', \'-\')) = ?';
        $args[] = strtolower($slug);
    }
    if ($modelo = query_param('modelo')) {
        $where[] = 'modelo = ?';
        $args[] = $modelo;
    }

    $sort = query_param('sort', 'newest');
    $order = match ($sort) {
        'price_asc' => 'precio ASC',
        'price_desc' => 'precio DESC',
        'km_asc' => 'kilometraje ASC',
        'year_desc' => '`año` DESC',
        default => 'created_at DESC',
    };

    $sqlWhere = $where ? ('WHERE ' . implode(' AND ', $where)) : '';

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM cars $sqlWhere");
    $countStmt->execute($args);
    $count = (int) $countStmt->fetchColumn();

    $limit = query_param('limit');
    $offset = query_param('offset', 0);
    $sql = "SELECT * FROM cars $sqlWhere ORDER BY $order";
    if ($limit !== null && $limit !== '') {
        $sql .= ' LIMIT ' . (int) $limit . ' OFFSET ' . (int) $offset;
    }
    $stmt = $pdo->prepare($sql);
    $stmt->execute($args);
    $rows = array_map('normalize_car', $stmt->fetchAll());
    Response::ok(['data' => $rows, 'count' => $count]);
}

function cars_get(PDO $pdo, string $id): void
{
    $stmt = $pdo->prepare('SELECT * FROM cars WHERE id = ?');
    $stmt->execute([$id]);
    $row = normalize_car($stmt->fetch() ?: null);
    if (!$row) Response::error('No encontrado', 404);
    Response::ok(['data' => $row]);
}

function cars_create(PDO $pdo, Auth $auth): void
{
    $auth->requireRole(['admin', 'seller']);
    $body = json_body();
    $id = $body['id'] ?? uuid_v4();
    $imgs = $body['imagenes'] ?? [];
    if (!is_array($imgs)) $imgs = [];
    $stmt = $pdo->prepare(
        'INSERT INTO cars (id, marca, modelo, `año`, precio, kilometraje, motor, transmision, combustible,
          color, puertas, traccion, aire, infoentretenimiento, descripcion, imagenes, status, visible)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    );
    $stmt->execute([
        $id,
        $body['marca'] ?? '',
        $body['modelo'] ?? '',
        (int) ($body['año'] ?? 0),
        (float) ($body['precio'] ?? 0),
        isset($body['kilometraje']) && $body['kilometraje'] !== null && $body['kilometraje'] !== ''
            ? (int) $body['kilometraje'] : null,
        $body['motor'] ?? null,
        $body['transmision'] ?? 'Manual',
        $body['combustible'] ?? 'Gasolina',
        $body['color'] ?? null,
        isset($body['puertas']) && $body['puertas'] !== '' && $body['puertas'] !== null ? (int) $body['puertas'] : null,
        $body['traccion'] ?? null,
        bool_from($body['aire'] ?? false) ? 1 : 0,
        $body['infoentretenimiento'] ?? null,
        $body['descripcion'] ?? null,
        json_encode(array_values($imgs), JSON_UNESCAPED_SLASHES),
        $body['status'] ?? 'available',
        bool_from($body['visible'] ?? true) ? 1 : 0,
    ]);
    $stmt = $pdo->prepare('SELECT * FROM cars WHERE id = ?');
    $stmt->execute([$id]);
    Response::ok(['data' => normalize_car($stmt->fetch())], 201);
}

function cars_update(PDO $pdo, Auth $auth, string $id): void
{
    $auth->requireRole(['admin', 'seller']);
    $body = json_body();
    $allowed = [
        'marca', 'modelo', 'año', 'precio', 'kilometraje', 'motor', 'transmision', 'combustible',
        'color', 'puertas', 'traccion', 'aire', 'infoentretenimiento', 'descripcion', 'imagenes',
        'status', 'visible',
    ];
    $sets = [];
    $args = [];
    foreach ($allowed as $field) {
        if (!array_key_exists($field, $body)) continue;
        $col = $field === 'año' ? '`año`' : $field;
        if ($field === 'imagenes') {
            $sets[] = "$col = ?";
            $args[] = json_encode(array_values((array) $body[$field]), JSON_UNESCAPED_SLASHES);
        } elseif ($field === 'aire' || $field === 'visible') {
            $sets[] = "$col = ?";
            $args[] = bool_from($body[$field]) ? 1 : 0;
        } else {
            $sets[] = "$col = ?";
            $args[] = $body[$field];
        }
    }
    if (!$sets) Response::error('Nada que actualizar');
    $args[] = $id;
    $pdo->prepare('UPDATE cars SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($args);
    $stmt = $pdo->prepare('SELECT * FROM cars WHERE id = ?');
    $stmt->execute([$id]);
    $row = normalize_car($stmt->fetch() ?: null);
    if (!$row) Response::error('No encontrado', 404);
    Response::ok(['data' => $row]);
}

function cars_delete(PDO $pdo, Auth $auth, string $id): void
{
    $auth->requireAdmin();
    $pdo->prepare('DELETE FROM cars WHERE id = ?')->execute([$id]);
    Response::ok(['ok' => true]);
}

/* ── Leads ────────────────────────────────────────── */

function leads_list(PDO $pdo, Auth $auth): void
{
    $user = $auth->requireUser();
    $sql = 'SELECT * FROM leads';
    $args = [];
    if ($user['role'] !== 'admin') {
        $sql .= ' WHERE assigned_to = ?';
        $args[] = $user['id'];
    }
    $sql .= ' ORDER BY created_at DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($args);
    Response::ok(['data' => array_map('normalize_lead', $stmt->fetchAll())]);
}

function leads_create(PDO $pdo, Auth $auth): void
{
    // Public insert allowed (anon) — mirrors former RLS
    $body = json_body();
    $id = $body['id'] ?? uuid_v4();
    $stmt = $pdo->prepare(
        'INSERT INTO leads (id, nombre, email, telefono, marca, modelo, `año`, kilometraje, descripcion, status, last_activity_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,NOW())'
    );
    $stmt->execute([
        $id,
        $body['nombre'] ?? '',
        $body['email'] ?? '',
        $body['telefono'] ?? null,
        $body['marca'] ?? null,
        $body['modelo'] ?? null,
        isset($body['año']) && $body['año'] !== null && $body['año'] !== '' ? (int) $body['año'] : null,
        isset($body['kilometraje']) && $body['kilometraje'] !== null && $body['kilometraje'] !== ''
            ? (int) $body['kilometraje'] : null,
        $body['descripcion'] ?? null,
        $body['status'] ?? 'pending',
    ]);
    $stmt = $pdo->prepare('SELECT * FROM leads WHERE id = ?');
    $stmt->execute([$id]);
    Response::ok(['data' => normalize_lead($stmt->fetch())], 201);
}

function leads_update(PDO $pdo, Auth $auth, string $id): void
{
    $user = $auth->requireRole(['admin', 'seller']);
    $body = json_body();
    $allowed = ['status', 'notas', 'assigned_to', 'last_activity_at', 'precio_cierre', 'nombre', 'email', 'telefono', 'descripcion'];
    if ($user['role'] !== 'admin' && array_key_exists('assigned_to', $body)) {
        Response::error('Solo admin puede asignar leads', 403);
    }
    $sets = [];
    $args = [];
    foreach ($allowed as $field) {
        if (!array_key_exists($field, $body)) continue;
        $sets[] = "$field = ?";
        $args[] = $body[$field];
    }
    if (!$sets) Response::error('Nada que actualizar');
    $args[] = $id;
    $pdo->prepare('UPDATE leads SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($args);
    $stmt = $pdo->prepare('SELECT * FROM leads WHERE id = ?');
    $stmt->execute([$id]);
    Response::ok(['data' => normalize_lead($stmt->fetch())]);
}

function leads_delete(PDO $pdo, Auth $auth, string $id): void
{
    $auth->requireAdmin();
    $pdo->prepare('DELETE FROM leads WHERE id = ?')->execute([$id]);
    Response::ok(['ok' => true]);
}

function leads_stale_count(PDO $pdo, Auth $auth): void
{
    $auth->requireUser();
    $days = (int) (query_param('days') ?? 3);
    $stmt = $pdo->prepare(
        'SELECT COUNT(*) FROM leads
         WHERE COALESCE(last_activity_at, created_at) < DATE_SUB(NOW(), INTERVAL ? DAY)'
    );
    $stmt->execute([$days]);
    Response::ok(['count' => (int) $stmt->fetchColumn()]);
}

/* ── Lead events ──────────────────────────────────── */

function lead_events_list(PDO $pdo, Auth $auth): void
{
    $auth->requireUser();
    $leadId = query_param('lead_id');
    if (!$leadId) Response::error('lead_id requerido');
    $stmt = $pdo->prepare(
        'SELECT e.*, p.nombre AS profile_nombre
         FROM lead_events e
         LEFT JOIN profiles p ON p.id = e.user_id
         WHERE e.lead_id = ?
         ORDER BY e.created_at DESC'
    );
    $stmt->execute([$leadId]);
    $rows = [];
    foreach ($stmt->fetchAll() as $r) {
        $r['profiles'] = $r['profile_nombre'] !== null ? ['nombre' => $r['profile_nombre']] : null;
        unset($r['profile_nombre']);
        $rows[] = $r;
    }
    Response::ok(['data' => $rows]);
}

function lead_events_create(PDO $pdo, Auth $auth): void
{
    $user = $auth->requireRole(['admin', 'seller']);
    $body = json_body();
    $id = uuid_v4();
    $pdo->prepare(
        'INSERT INTO lead_events (id, lead_id, user_id, event_type, old_value, new_value)
         VALUES (?,?,?,?,?,?)'
    )->execute([
        $id,
        $body['lead_id'] ?? '',
        $body['user_id'] ?? $user['id'],
        $body['event_type'] ?? 'note_added',
        $body['old_value'] ?? null,
        $body['new_value'] ?? null,
    ]);
    Response::ok(['data' => ['id' => $id]], 201);
}

/* ── Profiles ─────────────────────────────────────── */

function profiles_list(PDO $pdo, Auth $auth): void
{
    $auth->requireUser();
    $roles = query_param('roles'); // comma-separated
    $sql = 'SELECT id, nombre, email, role, active FROM profiles';
    $args = [];
    if ($roles) {
        $list = array_filter(array_map('trim', explode(',', $roles)));
        if ($list) {
            $placeholders = implode(',', array_fill(0, count($list), '?'));
            $sql .= " WHERE role IN ($placeholders)";
            $args = $list;
        }
    }
    $order = query_param('order', 'email');
    $allowedOrder = ['email', 'nombre'];
    if (!in_array($order, $allowedOrder, true)) $order = 'email';
    $sql .= " ORDER BY $order";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($args);
    Response::ok(['data' => array_map('normalize_profile', $stmt->fetchAll())]);
}

function profiles_update(PDO $pdo, Auth $auth, string $id): void
{
    $user = $auth->requireUser();
    $body = json_body();
    if ($user['role'] !== 'admin' && $user['id'] !== $id) {
        Response::error('Permiso denegado', 403);
    }
    // Non-admin can only update own nombre
    if ($user['role'] !== 'admin') {
        if (!array_key_exists('nombre', $body)) Response::error('Nada que actualizar');
        $pdo->prepare('UPDATE profiles SET nombre = ? WHERE id = ?')->execute([$body['nombre'], $id]);
    } else {
        $sets = [];
        $args = [];
        foreach (['nombre', 'role', 'active', 'email'] as $f) {
            if (!array_key_exists($f, $body)) continue;
            if ($f === 'active') {
                $sets[] = 'active = ?';
                $args[] = bool_from($body[$f]) ? 1 : 0;
            } else {
                $sets[] = "$f = ?";
                $args[] = $body[$f];
            }
        }
        if (!$sets) Response::error('Nada que actualizar');
        $args[] = $id;
        $pdo->prepare('UPDATE profiles SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($args);
    }
    $stmt = $pdo->prepare('SELECT id, nombre, email, role, active FROM profiles WHERE id = ?');
    $stmt->execute([$id]);
    Response::ok(['data' => normalize_profile($stmt->fetch())]);
}

/* ── Settings ─────────────────────────────────────── */

function settings_get(PDO $pdo, Auth $auth): void
{
    $auth->requireUser();
    $key = query_param('key', 'follow_up_days');
    $stmt = $pdo->prepare('SELECT `key`, value, updated_at FROM settings WHERE `key` = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    if (!$row) Response::error('No encontrado', 404);
    Response::ok(['data' => $row]);
}

function settings_put(PDO $pdo, Auth $auth): void
{
    $auth->requireAdmin();
    $body = json_body();
    $key = $body['key'] ?? 'follow_up_days';
    $value = (string) ($body['value'] ?? '');
    $pdo->prepare(
        'INSERT INTO settings (`key`, value, updated_at) VALUES (?,?,NOW())
         ON DUPLICATE KEY UPDATE value = VALUES(value), updated_at = NOW()'
    )->execute([$key, $value]);
    Response::ok(['ok' => true]);
}

/* ── Compras ──────────────────────────────────────── */

function compras_list(PDO $pdo, Auth $auth): void
{
    $user = $auth->requireRole(['admin', 'seller']);
    $sql = 'SELECT * FROM compras';
    $args = [];
    if ($user['role'] !== 'admin') {
        $sql .= ' WHERE created_by = ?';
        $args[] = $user['id'];
    }
    $sql .= ' ORDER BY fecha_compra DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($args);
    Response::ok(['data' => array_map('normalize_compra', $stmt->fetchAll())]);
}

function compras_create(PDO $pdo, Auth $auth): void
{
    $user = $auth->requireRole(['admin', 'seller']);
    $body = json_body();
    $id = uuid_v4();
    $pdo->prepare(
        'INSERT INTO compras (id, marca, modelo, `año`, color, kilometraje, vin, precio_compra, fecha_compra,
          vendedor_nombre, vendedor_telefono, forma_pago, doc_factura, doc_tenencia, doc_verificacion, notas, created_by)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)'
    )->execute([
        $id,
        $body['marca'] ?: null,
        $body['modelo'] ?: null,
        $body['año'] !== '' && $body['año'] !== null ? (int) $body['año'] : null,
        $body['color'] ?: null,
        $body['kilometraje'] !== '' && $body['kilometraje'] !== null ? (float) $body['kilometraje'] : null,
        $body['vin'] ?: null,
        (float) ($body['precio_compra'] ?? 0),
        $body['fecha_compra'] ?? date('Y-m-d'),
        $body['vendedor_nombre'] ?: null,
        $body['vendedor_telefono'] ?: null,
        $body['forma_pago'] ?: null,
        bool_from($body['doc_factura'] ?? false) ? 1 : 0,
        bool_from($body['doc_tenencia'] ?? false) ? 1 : 0,
        bool_from($body['doc_verificacion'] ?? false) ? 1 : 0,
        $body['notas'] ?: null,
        $body['created_by'] ?? $user['id'],
    ]);
    $stmt = $pdo->prepare('SELECT * FROM compras WHERE id = ?');
    $stmt->execute([$id]);
    Response::ok(['data' => normalize_compra($stmt->fetch())], 201);
}

function compras_update(PDO $pdo, Auth $auth, string $id): void
{
    $user = $auth->requireRole(['admin', 'seller']);
    // sellers may only update own
    if ($user['role'] !== 'admin') {
        $chk = $pdo->prepare('SELECT created_by FROM compras WHERE id = ?');
        $chk->execute([$id]);
        $row = $chk->fetch();
        if (!$row || $row['created_by'] !== $user['id']) {
            Response::error('Permiso denegado', 403);
        }
    }
    $body = json_body();
    $allowed = [
        'marca', 'modelo', 'año', 'color', 'kilometraje', 'vin', 'precio_compra', 'fecha_compra',
        'vendedor_nombre', 'vendedor_telefono', 'forma_pago', 'doc_factura', 'doc_tenencia',
        'doc_verificacion', 'doc_factura_url', 'doc_tenencia_url', 'doc_verificacion_url',
        'notas', 'car_id',
    ];
    $sets = [];
    $args = [];
    foreach ($allowed as $field) {
        if (!array_key_exists($field, $body)) continue;
        $col = $field === 'año' ? '`año`' : $field;
        if (in_array($field, ['doc_factura', 'doc_tenencia', 'doc_verificacion'], true)) {
            $sets[] = "$col = ?";
            $args[] = bool_from($body[$field]) ? 1 : 0;
        } else {
            $sets[] = "$col = ?";
            $args[] = $body[$field];
        }
    }
    if (!$sets) Response::error('Nada que actualizar');
    $args[] = $id;
    $pdo->prepare('UPDATE compras SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($args);
    $stmt = $pdo->prepare('SELECT * FROM compras WHERE id = ?');
    $stmt->execute([$id]);
    Response::ok(['data' => normalize_compra($stmt->fetch())]);
}

function compras_delete(PDO $pdo, Auth $auth, string $id): void
{
    $auth->requireAdmin();
    $pdo->prepare('DELETE FROM compras WHERE id = ?')->execute([$id]);
    Response::ok(['ok' => true]);
}

/* ── Gastos ───────────────────────────────────────── */

function gastos_list(PDO $pdo, Auth $auth): void
{
    $auth->requireRole(['admin', 'seller']);
    $compraId = query_param('compra_id');
    $ids = query_param('compra_ids'); // comma-separated
    if ($compraId) {
        $stmt = $pdo->prepare('SELECT * FROM gastos_compra WHERE compra_id = ? ORDER BY created_at ASC');
        $stmt->execute([$compraId]);
        Response::ok(['data' => $stmt->fetchAll()]);
    }
    if ($ids) {
        $list = array_filter(explode(',', $ids));
        if (!$list) Response::ok(['data' => []]);
        $ph = implode(',', array_fill(0, count($list), '?'));
        $stmt = $pdo->prepare("SELECT * FROM gastos_compra WHERE compra_id IN ($ph)");
        $stmt->execute($list);
        Response::ok(['data' => $stmt->fetchAll()]);
    }
    Response::error('compra_id o compra_ids requerido');
}

function gastos_create(PDO $pdo, Auth $auth): void
{
    $auth->requireRole(['admin', 'seller']);
    $body = json_body();
    $id = uuid_v4();
    $pdo->prepare(
        'INSERT INTO gastos_compra (id, compra_id, concepto, monto, fecha) VALUES (?,?,?,?,?)'
    )->execute([
        $id,
        $body['compra_id'] ?? '',
        $body['concepto'] ?? '',
        (float) ($body['monto'] ?? 0),
        $body['fecha'] ?: null,
    ]);
    $stmt = $pdo->prepare('SELECT * FROM gastos_compra WHERE id = ?');
    $stmt->execute([$id]);
    Response::ok(['data' => $stmt->fetch()], 201);
}

/* ── Uploads ──────────────────────────────────────── */

function upload_car_image(PDO $pdo, Auth $auth, array $config): void
{
    $auth->requireRole(['admin', 'seller']);
    if (empty($_FILES['file'])) Response::error('Archivo requerido');
    $file = $_FILES['file'];
    $carId = $_POST['car_id'] ?? uuid_v4();
    $allowed = ['image/jpeg', 'image/png', 'image/webp'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mime, $allowed, true)) Response::error('Formato no permitido');
    if ($file['size'] > 5 * 1024 * 1024) Response::error('Máximo 5MB');
    $safe = preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
    $rel = 'car-images/' . $carId . '/' . time() . '-' . $safe;
    $dir = ensure_upload_dir($config['uploads_path'], 'car-images/' . $carId);
    $dest = $dir . '/' . time() . '-' . $safe;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        Response::error('Error al guardar archivo', 500);
    }
    // Fix relative path to match actual filename
    $rel = 'car-images/' . $carId . '/' . basename($dest);
    Response::ok([
        'path' => $rel,
        'publicUrl' => public_upload_url($config, $rel),
        'car_id' => $carId,
    ]);
}

function upload_compra_doc(PDO $pdo, Auth $auth, array $config): void
{
    $auth->requireRole(['admin', 'seller']);
    if (empty($_FILES['file'])) Response::error('Archivo requerido');
    $file = $_FILES['file'];
    $compraId = $_POST['compra_id'] ?? '';
    $segment = $_POST['path_segment'] ?? 'factura';
    if ($compraId === '' || !in_array($segment, ['factura', 'tenencia', 'verificacion'], true)) {
        Response::error('compra_id y path_segment inválidos');
    }
    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    if (!in_array($mime, $allowed, true)) Response::error('Tipo de archivo no permitido');
    if ($file['size'] > 5 * 1024 * 1024) Response::error('Máximo 5MB');
    $safe = preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
    $dir = ensure_upload_dir($config['uploads_path'], "compra-docs/{$compraId}/{$segment}");
    $name = time() . '-' . $safe;
    $dest = $dir . '/' . $name;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        Response::error('Error al guardar archivo', 500);
    }
    $rel = "compra-docs/{$compraId}/{$segment}/{$name}";
    // Auth-gated URL — direct /uploads/compra-docs/ is denied by .htaccess
    $serveUrl = rtrim($config['site_url'], '/') . '/api/upload/compra-doc?path=' . rawurlencode($rel);
    Response::ok([
        'path' => $rel,
        'publicUrl' => $serveUrl,
    ]);
}

/** Stream a compra doc to authenticated staff (webroot compra-docs is denied). */
function serve_compra_doc(Auth $auth, array $config): void
{
    $auth->requireRole(['admin', 'seller']);
    $path = (string) (query_param('path') ?? '');
    if ($path === '' || str_contains($path, '..')) {
        Response::error('path inválido');
    }
    if (str_contains($path, '/compra-docs/')) {
        $path = 'compra-docs/' . explode('/compra-docs/', $path, 2)[1];
    }
    if (!preg_match('#^compra-docs/[a-zA-Z0-9._/-]+$#', $path)) {
        Response::error('path inválido');
    }
    $full = rtrim($config['uploads_path'], '/') . '/' . $path;
    if (!is_file($full)) {
        Response::error('Archivo no encontrado', 404);
    }
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = finfo_file($finfo, $full) ?: 'application/octet-stream';
    finfo_close($finfo);
    header('Content-Type: ' . $mime);
    header('Content-Length: ' . (string) filesize($full));
    header('Content-Disposition: inline; filename="' . basename($full) . '"');
    header('X-Content-Type-Options: nosniff');
    readfile($full);
    exit;
}

function upload_delete(Auth $auth, array $config): void
{
    $auth->requireRole(['admin', 'seller']);
    $body = json_body();
    $path = (string) ($body['path'] ?? '');
    if ($path === '' || str_contains($path, '..')) {
        Response::error('path inválido');
    }
    // Accept full public URL or relative path under car-images / compra-docs
    if (str_contains($path, '/car-images/')) {
        $path = 'car-images/' . explode('/car-images/', $path, 2)[1];
    } elseif (str_contains($path, '/compra-docs/')) {
        $path = 'compra-docs/' . explode('/compra-docs/', $path, 2)[1];
    }
    if (!preg_match('#^(car-images|compra-docs)/#', $path)) {
        Response::error('path inválido');
    }
    $full = rtrim($config['uploads_path'], '/') . '/' . $path;
    if (is_file($full)) {
        @unlink($full);
    }
    Response::ok(['ok' => true]);
}

/* ── Users admin ──────────────────────────────────── */

function users_create(PDO $pdo, Auth $auth): void
{
    $auth->requireAdmin();
    $body = json_body();
    $email = trim((string) ($body['email'] ?? ''));
    $password = (string) ($body['password'] ?? '');
    $nombre = trim((string) ($body['nombre'] ?? ''));
    $role = $body['role'] ?? 'viewer';
    if ($email === '' || $password === '' || $nombre === '') {
        Response::error('Nombre, email y contraseña son requeridos');
    }
    if (strlen($password) < 6) {
        Response::error('La contraseña debe tener al menos 6 caracteres');
    }
    if (!in_array($role, ['admin', 'seller', 'viewer'], true)) {
        Response::error('Rol inválido');
    }
    $id = uuid_v4();
    $hash = password_hash($password, PASSWORD_BCRYPT);
    try {
        $pdo->beginTransaction();
        $pdo->prepare('INSERT INTO users (id, email, password_hash) VALUES (?,?,?)')
            ->execute([$id, $email, $hash]);
        $pdo->prepare('INSERT INTO profiles (id, nombre, email, role, active) VALUES (?,?,?,?,1)')
            ->execute([$id, $nombre, $email, $role]);
        $pdo->commit();
    } catch (PDOException $e) {
        $pdo->rollBack();
        Response::error('No se pudo crear el usuario (email duplicado?)');
    }
    Response::ok(['id' => $id, 'email' => $email, 'nombre' => $nombre, 'role' => $role, 'active' => true]);
}

function users_toggle(PDO $pdo, Auth $auth): void
{
    $caller = $auth->requireAdmin();
    $body = json_body();
    $userId = $body['userId'] ?? '';
    $active = $body['active'] ?? null;
    if ($userId === '' || !is_bool($active) && !in_array($active, [0, 1, '0', '1', true, false], true)) {
        // accept JSON boolean
        if (!array_key_exists('active', $body) || $userId === '') {
            Response::error('userId y active son requeridos');
        }
    }
    $activeBool = bool_from($active);
    if ($userId === $caller['id']) {
        Response::error('No puedes desactivarte a ti mismo');
    }
    $stmt = $pdo->prepare('SELECT id FROM profiles WHERE id = ?');
    $stmt->execute([$userId]);
    if (!$stmt->fetch()) Response::error('Usuario no encontrado', 404);
    $pdo->prepare('UPDATE profiles SET active = ? WHERE id = ?')
        ->execute([$activeBool ? 1 : 0, $userId]);
    Response::ok(['ok' => true, 'active' => $activeBool]);
}

function users_delete(PDO $pdo, Auth $auth): void
{
    $caller = $auth->requireAdmin();
    $body = json_body();
    $userId = $body['userId'] ?? '';
    if ($userId === '') Response::error('userId es requerido');
    if ($userId === $caller['id']) {
        Response::error('No puedes eliminarte a ti mismo');
    }
    $stmt = $pdo->prepare('SELECT id FROM profiles WHERE id = ?');
    $stmt->execute([$userId]);
    if (!$stmt->fetch()) Response::error('Usuario no encontrado', 404);
    $pdo->prepare('UPDATE leads SET assigned_to = NULL WHERE assigned_to = ?')->execute([$userId]);
    $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$userId]);
    Response::ok(['ok' => true]);
}

/* ── Car price (Mercado Libre proxy) ──────────────── */

function car_price(): void
{
    header('Access-Control-Allow-Origin: *');
    $marca = query_param('marca');
    $modelo = query_param('modelo');
    $año = query_param('año');
    if (!$marca || !$modelo || !$año) {
        Response::error('Missing params');
    }
    $q = rawurlencode("$marca $modelo $año");
    $url = "https://api.mercadolibre.com/sites/MLM/search?category=MLM1744&q={$q}&limit=50";
    $ctx = stream_context_create([
        'http' => [
            'header' => "User-Agent: Mozilla/5.0 (compatible; AutoKlic/1.0)\r\nAccept: application/json\r\n",
            'timeout' => 20,
        ],
    ]);
    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false) {
        Response::ok(['found' => false, 'reason' => 'exception', 'detail' => 'fetch failed']);
    }
    $data = json_decode($raw, true) ?: [];
    $prices = [];
    foreach ($data['results'] ?? [] as $r) {
        if (($r['currency_id'] ?? '') === 'MXN' && ($r['price'] ?? 0) >= 40000 && $r['price'] <= 8000000) {
            $prices[] = (float) $r['price'];
        }
    }
    if (count($prices) < 4) {
        Response::ok(['found' => false, 'reason' => 'not_enough', 'count' => count($prices)]);
    }
    sort($prices);
    $n = count($prices);
    $q1 = $prices[(int) floor($n * 0.25)];
    $q3 = $prices[(int) floor($n * 0.75)];
    $iqr = $q3 - $q1;
    $filtered = array_values(array_filter($prices, fn($p) => $p >= $q1 - 1.5 * $iqr && $p <= $q3 + 1.5 * $iqr));
    if (count($filtered) < 3) {
        Response::ok(['found' => false, 'reason' => 'outliers_removed', 'count' => count($filtered)]);
    }
    $median = $filtered[(int) floor(count($filtered) / 2)];
    $avg = (int) round(array_sum($filtered) / count($filtered));
    $central = (int) round(($median + $avg) / 2);
    Response::ok([
        'found' => true,
        'median' => $central,
        'count' => count($data['results'] ?? []),
        'usable' => count($filtered),
    ]);
}
