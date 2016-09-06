<?php
$url = 'https://tritone.webuntis.com/WebUntis/Timetable.do';
$fields = [];
$action = $_GET['action'] ?? null;

switch ($action) {
	case 'timetable':
		$fields['ajaxCommand'] = 'getWeeklyTimetable';
		$fields['elementType'] = $_GET['elementType'] ?? 1;
		$fields['elementId'] = $_GET['elementId'] ?? null;
		$fields['date'] = date('Ymd', strtotime($_GET['time']) ?? time());
		$fields['formatId'] = 3;
		$fields['departmentId'] = 29;
		$fields['filterId'] = -2;

		break;

	case 'elements':
		$fields['ajaxCommand'] = 'getPageConfig';
		$fields['type'] = $_GET['elementType'] ?? 1;
		$fields['filter.departmentId'] = -1;
		$fields['formatId'] = 1;

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
curl_setopt($ch, CURLOPT_POSTFIELDS, $fields);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Cookie: schoolname=_SUQtWm9ldGVybWVlcg==']);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HEADER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$json = @json_decode($response, true);

if ($json === null)
	$action = 'webuntis.offline';

$result = null;
$error = null;

switch ($action) {
	case 'timetable':
		$elements = [];
		$periods = [];

		foreach ($json['result']['data']['elements'] as $element)
			$elements[$element['id']] = $element;

		$lastTime = null;
		$lastTimeEnd = null;

		usort($json['result']['data']['elementPeriods'][$fields['elementId']], function ($a, $b) {
			return $a['startTime'] - $b['startTime'];
		});

		foreach ($json['result']['data']['elementPeriods'][$fields['elementId']] as $period) {
			if ($period['date'] != $fields['date'])
				continue;

			if ($lastTime != null && $lastTime === $period['startTime'] && $lastTimeEnd != null && $lastTimeEnd === $period['endTime']) {
				$newPeriod = end($periods);
				array_pop($periods);
			} else {
				$date = strtotime(substr($period['date'], 6, 2) . '-' . substr($period['date'], 4, 2) . '-' . substr($period['date'], 0, 4));

				if ($lastTime != null && $lastTimeEnd < $period['startTime']) {
					$break = [];
					$previousPeriod = end($periods);
					$break['startTime'] = $previousPeriod['endTime'];
					$break['endTime'] = [
						'hour' => substr($period['startTime'], 0, -2),
						'minute' => substr($period['startTime'], -2),
						'total' => ((int)substr($period['startTime'], 0, -2) * 60) + ((int)substr($period['startTime'], -2))
					];
					$break['endTime']['stamp'] = $date + $break['endTime']['total'] * 60;
					$break['date'] = $date;
					$break['isBreak'] = true;
					$break['isLongBreak'] = $break['endTime']['total'] - $break['startTime']['total'] > 15;
					$break['elements'] = [];

					$periods[] = $break;
				}

				$newPeriod = [];
				$newPeriod['id'] = $period['id'];
				$newPeriod['startTime'] = [
					'hour' => substr($period['startTime'], 0, -2),
					'minute' => substr($period['startTime'], -2),
					'total' => ((int)substr($period['startTime'], 0, -2) * 60) + ((int)substr($period['startTime'], -2))
				];
				$newPeriod['startTime']['stamp'] = $date + $newPeriod['startTime']['total'] * 60;
				$newPeriod['endTime'] = [
					'hour' => substr($period['endTime'], 0, -2),
					'minute' => substr($period['endTime'], -2),
					'total' => ((int)substr($period['endTime'], 0, -2) * 60) + ((int)substr($period['endTime'], -2))
				];
				$newPeriod['endTime']['stamp'] = $date + $newPeriod['endTime']['total'] * 60;
				$newPeriod['date'] = $date;
				$newPeriod['cancelled'] = $period['cellState'] === 'CANCEL';
				$newPeriod['elements'] = [];
			}

			foreach ($period['elements'] as $element) {
				$found = false;

				if (isset($newPeriod['elements'][$element['type']]))
					foreach ($newPeriod['elements'][$element['type']] as $existingElement)
						if ($existingElement['id'] === $element['id'])
							$found = true;

				if (!$found)
					$newPeriod['elements'][$element['type']][] = $elements[$element['id']];
			}

			$periods[] = $newPeriod;

			$lastTime = $period['startTime'];
			$lastTimeEnd = $period['endTime'];
		}

		usort($periods, function ($a, $b) {
			return $a['startTime']['total'] - $b['startTime']['total'] + (isset($a['cancelled']) && $a['cancelled'] ? 1 : 0);
		});

		foreach ($periods as $index => &$period) {
			if ($period['startTime']['total'] === $period['endTime']['total'])
				unset($periods[$index]);
			else if (isset($period['isBreak']) && $period['isBreak']) {
				if ($index === count($periods) - 1)
					unset($periods[$index]);
				else if ((!isset($periods[$index - 1]) || $periods[$index - 1]['cancelled']) && (!isset($periods[$index + 1]) || $periods[$index + 1]['cancelled']))
					$period['cancelled'] = true;
			}
		}

		$result = $periods;
		break;

	case 'elements':
		$classes = [];

		foreach ($json['elements'] as $element) {
			$classes[] = [
				'id' => $element['id'],
				'display_name' => $element['displayname'],
				'long_name' => $element['longName'],
				'name' => $element['name']
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
