<?php
$config = <<<XML
<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
	<msapplication>
		<tile>
			<square70x70logo src="assets/img/logo_large.png"/>
			<square150x150logo src="assets/img/logo_large.png"/>
			<wide310x150logo src="assets/img/logo_large.png"/>
			<square310x310logo src="assets/img/logo_large.png"/>
			<TileColor>#FF9900</TileColor>
		</tile>

		<notification>
			<polling-uri src="windows.php?poll"/>
			<frequency>10</frequency>
			<cycle>0</cycle>
		</notification>
	</msapplication>
</browserconfig>
XML;

$poll = <<<XML
<?xml version="1.0" encoding="utf-8"?>
<tile>
	<visual lang="nl-NL" version="2">
		<binding template="TileSquare150x150PeekImageAndText04" branding="name">
			<text id="1">First image</text>
		</binding>

		<binding template="TileWide310x150ImageAndText01" branding="name">
			<image id="1" src="assets/img/logo_large.png"/>
			<text id="1">First image</text>
		</binding>

		<binding template="TileSquare310x310SmallImagesAndTextList01" branding="name">
			<image id="1" src="assets/img/logo_large.png"/>
			<image id="2" src="assets/img/logo_large.png"/>
			<image id="3" src="assets/img/logo_large.png"/>
			<text id="1">Rooster</text>
			<text id="2">Test</text>
			<text id="3">Test</text>
		</binding>
	</visual>
</tile>
XML;


if (isset($_GET['config'])) {
	header('content-type: application/xml');
	echo $config;
} else if (isset($_GET['poll'])) {
	header('content-type: application/xml');
	echo $config;
}