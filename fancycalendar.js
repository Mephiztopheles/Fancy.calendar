(function( $, Fancy ) {

    var NAME      = "FancyCalendar",
        logged    = false,
        VERSION   = "0.0.1",
        templates = [];


    function replaceWith( el, template ) {

        var attributes = Array.prototype.slice.call( el[ 0 ].attributes );
        el.replaceWith( template );
        attributes.forEach( function( it ) {
            template.attr( it.name, it.nodeValue );
        } );
        return template;
    }

    function FancyCalendar( el, settings ) {
        var SELF       = this;
        SELF.element   = el;
        this.events    = [];
        SELF.settings  = $.extend( {}, Fancy.settings [ NAME ], settings );
        this.clear();
        var calendar   = SELF.settings.templatePath + "calendar.html",
            event      = SELF.settings.templatePath + "event.html";
        SELF.templates = {
            calendar: templates[ calendar ],
            event   : templates[ event ]
        };
        if( Fancy.template ) {
            Fancy.loadTemplate( calendar )( function( template ) {
                SELF.templates.calendar = template;
                SELF.element            = replaceWith( el, template );
            } );
            Fancy.loadTemplate( event )( function( template ) {
                SELF.templates.event = template;
            } );
        } else {
            if( !SELF.templates.calendar ) {
                $.ajax( {
                    url    : calendar,
                    global : false,
                    success: function( html ) {
                        templates[ calendar ]   = $( html );
                        SELF.templates.calendar = templates[ calendar ];
                        SELF.element            = replaceWith( el, SELF.templates.calendar );
                    }
                } );
            } else {
                SELF.element = replaceWith( el, SELF.templates.calendar );
            }
            if( !SELF.templates.event ) {
                $.ajax( {
                    url    : event,
                    global : false,
                    success: function( html ) {
                        templates[ event ]   = $( html );
                        SELF.templates.event = templates[ event ];
                    }
                } );
            }
        }

        if( !logged ) {
            logged = true;
            Fancy.version( SELF );
        }
        return SELF;
    }

    FancyCalendar.api = FancyCalendar.prototype = {};
    FancyCalendar.api.version = VERSION;
    FancyCalendar.api.name    = NAME;
    FancyCalendar.api.event   = function() {
        var events = [];
        if( Fancy.getType( arguments[ 0 ] ) == "array" ) {
            events = arguments[ 0 ];
        } else {
            events = Array.prototype.slice.call( arguments );
        }
        $.merge( this.events, events );
        this.clear();
        this.addEvents();
        return this;
    };

    FancyCalendar.api.clear     = function() {
        this.skeleton = {
            head: this.element.find( "." + NAME + "-head" ),
            body: this.element.find( "." + NAME + "-body" ).html( "" )
        };
    };
    FancyCalendar.api.addEvents = function() {
        var SELF     = this;
        this._events = [];
        this.events.forEach( function( event, i ) {
            console.log( SELF.templates );
            var tpl = SELF.templates.event.clone();
            SELF._events.push( Fancy( tpl ).template( { scope: event } ).compile() );
            SELF.skeleton.body.append( tpl );
        } );
    };

    Fancy.settings [ NAME ] = {
        templatePath    : "templates/",
        calendarTemplate: false
    };


    Fancy.api.calendar = function( settings ) {
        return this.set( NAME, function( el ) {
            return new FancyCalendar( el, settings );
        }, false );
    };

})( jQuery, Fancy );
