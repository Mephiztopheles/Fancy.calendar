(function(){
	
	var NAME = "FancyCalendar",
		   VERSION = "0.0.1",
		   templates = [];
	
	
		
		function replaceWith(el,template){
		
			var attributes = Array.prototype.slice.call(el[0].attributes);
			el.replaceWith(template);
			attributes.forEach(function(it){
				template.attr(it.name, it.nodeValue);
			});
			return template;
		}
	function FancyCalendar(el,settings){
		var SELF = this;
		SELF.settings = $.extend( {}, Fancy.settings [ NAME ], settings );
		this.templates = {
			calendar: templates[this.settings.templatePath + "calendar.html"]
		};
		if(!this.templates[this.settings.templatePath + "calendar.html"]) {
			$.ajax({
				url: this.settings.templatePath + "calendar.html",
				success: function(html) {
					templates[SELF.settings.templatePath + "calendar.html"] = $(html);
					SELF.templates.calendar = templates[SELF.settings.templatePath + "calendar.html"];
					SELF.element = replaceWith(el,SELF.templates.calendar)
				}
			});
		} else {
			SELF.element = replaceWith(el,SELF.templates.calendar);
		}
		
		
	}
	
	Fancy.settings [ NAME ] = {
        templatePath: "templates/"
    };
	
	
	Fancy.api.calendar      = function ( settings ) {
        return this.set( NAME, function ( el ) {
            return new FancyCalendar( el, settings );
        }, false );
    };
	
})();
