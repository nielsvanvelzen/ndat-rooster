var app = {
	data: {
		loading: true,
		elementType: null,
		elementId: null, // ao14a = 3637,
		date: new Date()
	},

	tpl: null,
	days: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
	months: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'november', 'december'],
	elements: {},

	apiRequest: function (action, data, callback) {
		var dataStr = '';

		for (var key in data)
			if (data.hasOwnProperty(key))
				dataStr += '&' + encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);

		$.getJSON('api/request.php?action=' + action + dataStr, function (json) {
			callback(json);
		});
	},

	getElements: function (type, cb) {
		if (type in app.elements && app.elements[type] != null && app.elements[type].length > 0)
			return cb(app.elements[type]);

		app.apiRequest('elements', {elementType: type}, function (json) {
			app.elements[type] = json.result;

			cb(json.result);
		});
	},

	addDate: function (days) {
		app.data.date.setDate(app.data.date.getDate() + days);
		app.updateTimetable();
	},

	showTemporaryTimetable: function (type, id) {
		var oldType = app.data.elementType;
		var oldId = app.data.elementId;

		app.data.elementType = type;
		app.data.elementId = id;

		app.updateTimetable();

		app.data.elementType = oldType;
		app.data.elementId = oldId;
	},

	updateTimetable: function (periods) {
		if (periods === undefined) {
			app.data.loading = true;
			app.updateTemplate();

			app.apiRequest('timetable', {time: app.data.date.toISOString(), elementType: app.data.elementType, elementId: app.data.elementId}, function (json) {
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

	updateClasslist: function (elements) {
		app.data.elements = elements;
	},

	updateTemplate: function () {
		document.body.innerHTML = app.tpl(app.data);

		$('.select2').select2();
	},

	initialize: function () {
		if (window.location.hash.length > 1) {
			this.data.date = new Date(decodeURIComponent(window.location.hash.split('date=')[1]));
		}

		app.data.elementType = window.localStorage.getItem('elementType');
		app.data.elementId = window.localStorage.getItem('elementId');

		Handlebars.registerHelper('date_str', function (date, type) {
			if (type === 1) {
				var days = Math.ceil((date.getTime() - Date.now()) / 86400000);

				if (days === -2)
					return 'Eergisteren';
				else if (days === -1)
					return 'Gisteren';
				else if (days === 0)
					return 'Vandaag';
				else if (days === 1)
					return 'Morgen';
				else if (days === 2)
					return 'Overmorgen';
			}

			return app.days[date.getDay()] + ' ' + date.getDate() + ' ' + app.months[date.getMonth()];
		});

		Handlebars.registerHelper('ifEq', function (v1, v2, options) {
			if (v1 == v2)
				return options.fn(this);

			return options.inverse(this);
		});

		async.parallel({
			json: function (cb) {
				app.apiRequest('timetable', {time: app.data.date.toISOString(), elementType: app.data.elementType, elementId: app.data.elementId}, function (json) {
					app.data.version = json.version;
					app.updateTimetable(json.result);

					cb();
				});
			},
			elements: function (cb) {
				app.getElements(app.data.elementType, function (result) {
					app.updateClasslist(result);

					cb();
				});
			},
			tpl: function (cb) {
				$.get('assets/tpl/site.hbs', function (tpl) {
					app.tpl = Handlebars.compile(tpl);

					cb();
				});
			}
		}, function () {
			app.data.loading = false;
			app.updateTemplate();
		});
	},

	save: function () {
		window.localStorage.setItem('elementType', app.data.elementType);
		window.localStorage.setItem('elementId', app.data.elementId);

		if (app.data.elementType === null)
			window.localStorage.removeItem('elementType');

		if (app.data.elementId === null)
			window.localStorage.removeItem('elementId');
	}
};


window.addEventListener('load', function () {
	app.initialize();
});

window.addEventListener('beforeunload', function () {
	app.save();
});