<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Database file
$db_file = __DIR__ . '/database.json';

// Read database
function readDatabase() {
    global $db_file;
    if (!file_exists($db_file)) {
        return ['users' => [], 'pending_approvals' => []];
    }
    return json_decode(file_get_contents($db_file), true);
}

// Write database
function writeDatabase($data) {
    global $db_file;
    file_put_contents($db_file, json_encode($data, JSON_PRETTY_PRINT));
}

// Send OTP via Telegram bot
function sendOTPToTelegram($chat_id, $otp) {
    $bot_token = "8488314208:AAEpn00TUMudtmGO4RgrFEtfxeLB235m6Qg";
    $message = "🔐 OTP Verification\n\nYour One-Time Password is:\n📱 **$otp**\n\nThis OTP is valid for 5 minutes.";
    
    $url = "https://api.telegram.org/bot{$bot_token}/sendMessage";
    $data = [
        'chat_id' => $chat_id,
        'text' => $message,
        'parse_mode' => 'Markdown'
    ];
    
    $options = [
        'http' => [
            'header' => "Content-type: application/x-www-form-urlencoded\r\n",
            'method' => 'POST',
            'content' => http_build_query($data)
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    return $result !== false;
}

// Generate OTP
function generateOTP() {
    return sprintf('%04d', rand(0, 9999));
}

// Main API logic
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $request_uri = $_SERVER['REQUEST_URI'];
    $query_string = $_SERVER['QUERY_STRING'];
    
    // Parse query parameters
    parse_str($query_string, $query_params);
    $user_token = $query_params['token'] ?? '';
    
    // Extract API token from path
    $path_parts = explode('/', $request_uri);
    $api_token = $path_parts[1] ?? '';
    
    // Log request for debugging
    error_log("API Request: token=$user_token, api_token=$api_token");
    
    if (empty($user_token) {
        http_response_code(400);
        echo json_encode(['error' => 'Token parameter is required']);
        exit;
    }
    
    if (empty($api_token)) {
        http_response_code(400);
        echo json_encode(['error' => 'API token is required in URL path']);
        exit;
    }
    
    $db = readDatabase();
    $user_found = null;
    
    // Find user by tokens
    foreach ($db['users'] as $user) {
        if ($user['user_token'] === $user_token && $user['api_token'] === $api_token && $user['status'] === 'active') {
            $user_found = $user;
            break;
        }
    }
    
    if ($user_found) {
        // Generate OTP
        $otp = generateOTP();
        
        // Send OTP to user via Telegram
        $otp_sent = sendOTPToTelegram($user_found['chat_id'], $otp);
        
        if ($otp_sent) {
            // Return success response
            echo json_encode([
                'success' => true,
                'profile_pic' => $user_found['profile_pic'] ?? 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                'name' => $user_found['name'],
                'username' => $user_found['username'],
                'OTP' => $otp,
                'message' => 'OTP sent successfully'
            ], JSON_PRETTY_PRINT);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to send OTP']);
        }
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Invalid token or user not found']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
?>
