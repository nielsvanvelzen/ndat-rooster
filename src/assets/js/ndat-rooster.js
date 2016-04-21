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

function updateClasslist(classes){
	for(var key in classes){
		if(!classes.hasOwnProperty(key))
			continue;

		var element = classes[key];

		document.getElementById('classes').innerHTML += '<option value="' + element.id + '">' + element.display_name + '</option>';
	}
}

window.addEventListener('load', function () {
	async.parallel({
		json: function (cb) {
			$.getJSON('api/request.php?action=timetable', function (json) {
				cb(null, json);
			});
		},
		/*classes: function (cb) {
			$.getJSON('api/request.php?action=classes', function (json) {
				cb(null, json);
			});
		},*/
		tpl: function (cb) {
			$.get('assets/tpl/timetable-item.hbs', function (tpl) {
				cb(null, Handlebars.compile(tpl));
			});
		}
	}, function (err, result) {
		updateTimetable(result.tpl, result.json.result);
		//updateClasslist(result.classes.result);
		$('[data-version-tag]').text(result.json.version);
	});
});