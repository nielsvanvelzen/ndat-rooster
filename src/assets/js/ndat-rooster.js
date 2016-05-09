var app = {
	data: {
		loading: true,
		date: new Date()
	},

	tpl: null,
	enableCache: true,

	apiRequest: function (action, data, callback) {
		if (app.enableCache && window.localStorage.getItem('api-' + action + '-' + data.join('-')) !== null) {
			var json = JSON.parse(window.localStorage.getItem('api-' + action + '-' + data.join('-')));

			if (json.date >= Date.now() - 15 * 60 * 1000) {
				callback(json.result);
				return;
			}
		}

		$.getJSON('api/request.php?action=' + action + '&' + data.join('&'), function (json) {
			window.localStorage.setItem('api-' + action + '-' + data.join('-'), JSON.stringify({date: Date.now(), result: json}));

			callback(json);
		});
	},

	addDate: function (days) {
		app.data.date.setDate(app.data.date.getDate() + days);
		app.updateTimetable();
	},

	updateTimetable: function (periods) {
		if (periods === undefined) {
			app.data.loading = true;
			app.updateTemplate();

			app.apiRequest('timetable', ['time=' + app.data.date.toISOString()], function (json) {
				app.data.loading = false;
				app.data.version = json.version;
				app.updateTimetable(json.result);
				app.updateTemplate();
			});

			return;
		}

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
		if (window.localStorage.getItem('disable-cache') === 'please')
			app.enableCache = false;

		async.parallel({
			json: function (cb) {
				app.apiRequest('timetable', ['time=' + app.data.date.toISOString()], function (json) {
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