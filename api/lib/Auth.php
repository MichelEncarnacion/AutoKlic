<?php

declare(strict_types=1);

final class Auth
{
    private PDO $pdo;
    private array $config;

    public function __construct(PDO $pdo, array $config)
    {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    public function issueToken(string $userId): string
    {
        $payload = [
            'sub' => $userId,
            'iat' => time(),
            'exp' => time() + (int) ($this->config['jwt_ttl_seconds'] ?? 604800),
        ];
        $body = $this->b64(json_encode($payload));
        $sig = $this->b64(hash_hmac('sha256', $body, $this->config['jwt_secret'], true));
        return $body . '.' . $sig;
    }

    public function verifyToken(?string $token): ?array
    {
        if (!$token || !str_contains($token, '.')) {
            return null;
        }
        [$body, $sig] = explode('.', $token, 2);
        $expected = $this->b64(hash_hmac('sha256', $body, $this->config['jwt_secret'], true));
        if (!hash_equals($expected, $sig)) {
            return null;
        }
        $payload = json_decode($this->ub64($body), true);
        if (!is_array($payload) || ($payload['exp'] ?? 0) < time()) {
            return null;
        }
        return $payload;
    }

    public function bearerUser(): ?array
    {
        $header = $_SERVER['HTTP_AUTHORIZATION']
            ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
            ?? '';
        if (!preg_match('/Bearer\s+(\S+)/i', $header, $m)) {
            return null;
        }
        $payload = $this->verifyToken($m[1]);
        if (!$payload) {
            return null;
        }
        $stmt = $this->pdo->prepare(
            'SELECT u.id, u.email, p.nombre, p.role, p.active
             FROM users u
             JOIN profiles p ON p.id = u.id
             WHERE u.id = ?'
        );
        $stmt->execute([$payload['sub']]);
        $user = $stmt->fetch();
        if (!$user || !(int) $user['active']) {
            return null;
        }
        $user['active'] = (bool) (int) $user['active'];
        return $user;
    }

    public function requireUser(): array
    {
        $user = $this->bearerUser();
        if (!$user) {
            Response::error('No autenticado', 401);
        }
        return $user;
    }

    public function requireRole(array $roles): array
    {
        $user = $this->requireUser();
        if (!in_array($user['role'], $roles, true)) {
            Response::error('Permiso denegado', 403);
        }
        return $user;
    }

    public function requireAdmin(): array
    {
        return $this->requireRole(['admin']);
    }

    private function b64(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private function ub64(string $data): string
    {
        $remainder = strlen($data) % 4;
        if ($remainder) {
            $data .= str_repeat('=', 4 - $remainder);
        }
        return base64_decode(strtr($data, '-_', '+/')) ?: '';
    }
}
