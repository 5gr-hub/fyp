<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5174',
        'http://localhost:5175',
        'http://127.0.0.1:5175',
        'https://hmis-a-kakumiro.onrender.com',
        'https://hmis-b.onrender.com',
        'https://drcp-backend-4538.onrender.com',
        'https://drcp-frontend.onrender.com',
    ],
    'allowed_origins_patterns' => [
        '#^http://127\.0\.0\.1:\d+$#',
        '#^http://localhost:\d+$#',
        '#^https://.*\.onrender\.com$#',
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 86400,
    'supports_credentials' => false,
];
