var app = {
	data: {
		loading: true
	},

	tpl: null,
	enableCache: false,

	apiRequest: function (action, data, callback) {
		if (app.enableCache && window.localStorage.getItem('api-' + action) !== null) {
			var json = JSON.parse(window.localStorage.getItem('api-' + action));

			if (json.date >= Date.now() - 15 * 60 * 1000) {
				callback(json.result);
				return;
			}
		}

		$.getJSON('api/request.php?action=' + action, function (json) {
			window.localStorage.setItem('api-' + action, JSON.stringify({date: Date.now(), result: json}));

			callback(json);
		});
	},

	updateTimetable: function (periods) {
		for (var key in periods) {
			if (!periods.hasOwnProperty(key))
				continue;

			var item = periods[key];

			var colorString = '';
			for (var elementKey in item.elements)
				if (item.elements.hasOwnProperty(elementKey))
					for (var elementSubKey in item.elements[elementKey])
						if (item.elements[elementKey].hasOwnProperty(elementSubKey))
							colorString += item.elements[elementKey][elementSubKey]['longName'];

			item.color = '#' + md5(colorString).slice(0, 6);
		}

		app.data.periods = periods;
	},

	updateClasslist: function (classes) {
		app.data.classes = classes;
	},

	updateTemplate: function () {
		document.body.innerHTML = app.tpl(app.data);
	},

	initialize: function () {
		async.parallel({
			json: function (cb) {
				app.apiRequest('timetable', [], function (json) {
					app.data.version = json.version;
					app.updateTimetable(json.result);

					cb();
				});
			},
			classes: function (cb) {
				app.apiRequest('classes', [], function (json) {
					app.updateClasslist(json.result);

					cb();
				});
			},
			tpl: function (cb) {
				if (app.enableCache && window.localStorage.getItem('api-site') !== null) {
					var json = JSON.parse(window.localStorage.getItem('tpl-site'));

					if (json.date >= Date.now() - 15 * 60 * 1000) {
						app.tpl = Handlebars.compile(json.tpl);

						cb();
						return;
					}
				}

				$.get('assets/tpl/site.hbs', function (tpl) {
					window.localStorage.setItem('tpl-site', JSON.stringify({date: Date.now(), tpl: tpl}));

					app.tpl = Handlebars.compile(tpl);

					cb();
				});
			}
		}, function () {
			app.data.loading = false;
			app.updateTemplate();
		});
	}
};


window.addEventListener('load', function () {
	app.initialize();
});