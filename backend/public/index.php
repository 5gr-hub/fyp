<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

// ── Raw CORS — must run before anything else ──────────────────────────────────
$allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
    'https://hmis-a-kakumiro.onrender.com',
    'https://hmis-b.onrender.com',
    'https://drcp-frontend.onrender.com',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

// Allow any *.onrender.com origin in addition to explicit list
$allowed = in_array($origin, $allowedOrigins)
    || (str_ends_with($origin, '.onrender.com') && str_starts_with($origin, 'https://'));

if ($allowed && $origin) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, Accept, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
}

// Immediately respond to preflight OPTIONS with 200
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
// ─────────────────────────────────────────────────────────────────────────────

// Determine if the application is in maintenance mode...
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}

// Register the Composer autoloader...
require __DIR__.'/../vendor/autoload.php';

// Bootstrap Laravel and handle the request...
/** @var Application $app */
$app = require_once __DIR__.'/../bootstrap/app.php';

$app->handleRequest(Request::capture());

