function updateTimetable(template, periods) {
	var container = document.getElementById('items');

	container.innerHTML = '';
	for (var key in periods) {
		if (!periods.hasOwnProperty(key))
			continue;

		var item = periods[key];

		container.innerHTML += template(item);
	}
}

window.addEventListener('load', function () {
	async.parallel({
		json: function (cb) {
			$.getJSON('data.php', function (json) {
				cb(null, json);
			});
		},
		tpl: function (cb) {
			$.get('assets/tpl/timetable-item.hbs', function (tpl) {
				cb(null, Handlebars.compile(tpl));
			});
		}
	}, function (err, result) {
		updateTimetable(result.tpl, result.json.periods);
		$('[data-version-tag]').text(result.json.version);
	});
});