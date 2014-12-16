NS('org.korsakow.controller');

var W = org.korsakow.WrapCallback;

/* Abstract parent for Widget controllers
 * 
 * Each controller has a DIV to which its view gets added. This DIV establishes the view's
 * position and size.
 * 
 */
Class.register('org.korsakow.controller.AbstractController', {
	initialize: function($super, model) {
		$super();
		this.model = model || {}; // default value is for jsmock limitation in tests (Object.setPrototypeOf should fix this)
		this.element = null;
		this.env = null;

		this.element = jQuery("<div />");
	},
	setup: function(env) {
		this.env = env;
	},
	destroy: function() {
		this.env = null;
		this.element.unbind();
		this.element.remove();
		this.element.empty();
		this.element = jQuery('<div />');
	}
});

/* Handles creating an interface's view based on it's widgets.
 * 
 */
var InterfaceController = org.korsakow.controller.InterfaceController = Class.register('org.korsakow.controller.InterfaceController', org.korsakow.controller.AbstractController, {
	initialize: function($super, model) {
		$super(model);
		this.controllers = [];
	},
	setup: function($super, env) {
		$super(env);

		this.element.addClass("interface")
			.css({
				width: '100%',
				height: '100%',
				'background-color': this.model.backgroundColor?this.model.backgroundColor:null
			});
		
		if (this.model.backgroundImage) {
			var imageUI = new org.korsakow.ui.ImageUI(this.model.backgroundImage);
			imageUI.element.addClass("backgroundImage")
				.css({
					top: '0',
					left: '0',
					width: '100%',
					position: 'absolute'
				});
			imageUI.load(env.resolvePath(this.model.backgroundImage.filename));
			this.element.append(imageUI.element);
		}

		for (var i = 0; i < this.model.widgets.length; ++i) {
			var widget = this.model.widgets[i];
			var widgetController;
			try {
				widgetController = org.korsakow.controller.WidgetControllerFactory.create(widget.type, widget);
			} catch (e) {
				org.korsakow.log.error(e);

				/*
					Removed the following throw.  It isn't being caught anywhere, and as long as there is
					a MainMedia Widget (a condition that is checked for elsewhere), the Korsakow media
					should still work, rather than crashing and showing nothing. --Phoenix 07-08-2104 (ddmmyy)
				*/
				//throw e;
			}
			this.controllers.push(widgetController);
			this.element.append(widgetController.element);
		}
	},
	destroy: function($super) {
		this.controllers.forEach(function(ctrl) {
			ctrl.destroy();
		});
		this.controllers = [];
		$super();
	}
});
