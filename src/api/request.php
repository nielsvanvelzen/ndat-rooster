<?php
//todo generate mellon-cookie

$url = 'https://hhs-ira3001.ads.hhs.nl/mellon/login?ReturnTo=/WebPlanner/webber/WEBVIEW_DB_HHS_1/overview/generate/json';
$urlElements = 'https://hhs-ira3001.ads.hhs.nl/mellon/login?ReturnTo=/WebPlanner/webber/WEBVIEW_DB_HHS_1/basket/index/resourcejson/type/Group';
$fields = [];
$action = $_GET['action'] ?? null;

switch ($action) {
	case 'timetable':
		$fields = [
			'Group' => [$_GET['elementId']],
			'fromDate' => date('Y-m-d', strtotime($_GET['time'] ?? time())),
			'toDate' => date('Y-m-d', strtotime($_GET['time'] ?? time())),
			'getDays[]' => [1, 2, 3, 4, 5, 6, 7],
			'show_grouped'=> 'show_grouped',
			'check_display_members[]' => ['Rooms', 'Occupations', 'Groups', 'Time', 'Activity_Name'],
			'showNormalBookings' => '1'
		];
		break;

	case 'elements':
		$url = $urlElements;
		break;
}

$key = $action . '?' . http_build_query($fields);
$key = md5($key);

header('cache-control: max-age=3600');
header('ETag: ' . $key);
ob_flush();

$version = null;

if (file_exists(__DIR__ . '/../../version'))
	$version = file_get_contents(__DIR__ . '/../../version');

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query(['json' => json_encode($fields)]));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Cookie: mellon-cookie=[:TODO:]', 'Content-Type: application/x-www-form-urlencoded']);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);
die($response);
$json = @json_decode($response, true);

if ($json === null)
	$action = 'offline';

$result = null;
$error = null;

switch ($action) {
	case 'timetable':
		if (is_string($json))
			$error = $json;

		$items = [];

		foreach($json['items'] as $item) {
			$newItem = $item;

			$newItem['startStr'] = date('H:i', $item['startTs']);
			$newItem['endStr'] = date('H:i', $item['endTs']);

			$items[] = $newItem;
		}

		usort($items, function($a, $b) {
			return $a['startTs'] - $b['startTs'];
		});

		$result = $items;
		break;

	case 'elements':
		$classes = [];

		foreach ($json['items'] as $element) {
			$classes[] = [
				'id' => $element['label'],
				'display_name' => $element['label'],
				'long_name' => $element['label'],
				'name' => $element['label']
			];
		}

		$result = $classes;
		break;
	case 'webuntis.offline':
		$result = [];
		$error = 'webuntis.offline';

		break;
}

$json = [
	'result' => $result,
	'version' => $version
];

if ($error)
	$json['error'] = $error;

header('Content-Type: application/json');
echo json_encode($json);
