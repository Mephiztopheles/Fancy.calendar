(function( $, Fancy ) {

    var NAME      = "FancyCalendar",
        logged    = false,
        VERSION   = "0.0.1",
        SETTINGS  = [],
        id        = 0,
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
        this.element     = el;
        this.events      = [];
        this.id          = id++;
        this.settings    = $.extend( {}, Fancy.settings [ NAME ], settings );
        Fancy.check( this.settings, {
            eventStartField: { type: "String", required: true },
            eventEndField  : { type: "String", required: true },
            weekTemplate   : { type: "String", required: true },
            eventTemplate  : { type: "String", required: true }
        } );
        var SELF         = this,
            weekCalendar = SELF.settings.templatePath + SELF.settings.weekTemplate,
            event        = SELF.settings.templatePath + SELF.settings.eventTemplate;
        this.templates   = {
            weekCalendar: templates[ weekCalendar ],
            event       : templates[ event ]
        };

        SETTINGS[ this.id ] = {
            outstandingEvents: function() { },
            delayedFunctions : [],
            eventID          : 0
        };

        if( Fancy.template ) {
            Fancy.loadTemplate( weekCalendar )( function( template ) {
                SELF.templates.weekCalendar = template;
                SELF.element                = replaceWith( el, template );
                SETTINGS[ SELF.id ].delayedFunctions.forEach( function( it ) {
                    it();
                } );
            } );
            Fancy.loadTemplate( event )( function( template ) {
                SELF.templates.event = template;
                SETTINGS[ SELF.id ].outstandingEvents();
            } );
        } else {
            if( !SELF.templates.weekCalendar ) {
                $.ajax( {
                    url    : weekCalendar,
                    global : false,
                    success: function( html ) {
                        templates[ weekCalendar ]   = $( html );
                        SELF.templates.weekCalendar = templates[ weekCalendar ];
                        SELF.element                = replaceWith( el, SELF.templates.weekCalendar );
                        SETTINGS[ SELF.id ].delayedFunctions.forEach( function( it ) {
                            it();
                        } );
                        SETTINGS[ SELF.id ].outstandingEvents();
                    }
                } );
            } else {
                SELF.element = replaceWith( el, SELF.templates.weekCalendar );
            }
            if( !SELF.templates.event ) {
                $.ajax( {
                    url    : event,
                    global : false,
                    success: function( html ) {
                        templates[ event ]   = $( html );
                        SELF.templates.event = templates[ event ];
                        SETTINGS[ SELF.id ].outstandingEvents();
                    }
                } );
            }
        }

        this.clear();
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
        var events = [],
            SELF   = this;
        if( Fancy.getType( arguments[ 0 ] ) == "array" ) {
            events = arguments[ 0 ];
        } else {
            events = Array.prototype.slice.call( arguments );
        }
        events.forEach( function( it ) {
            Object.defineProperty( it, "$id", {
                value   : SETTINGS[ SELF.id ].eventID++,
                writable: false, enumerable: false, configurable: false
            } );
        } );
        $.merge( this.events, events );
        this.clear();
        this.addEvents();
        return this;
    };

    FancyCalendar.api.clear       = function() {
        var SELF = this;
        if( SELF.templates.weekCalendar ) {
            this.skeleton = {
                head: this.element.find( "." + NAME + "-head" ),
                body: this.element.find( "." + NAME + "-events-body" ).html( "" )
            };
            var i         = 0;
            while( i < 7 ) {
                i++;
                this.skeleton.body.append( $( "<div/>", { "class": NAME + "-events-day" } ) );
            }

        } else {
            SETTINGS[ this.id ].delayedFunctions.push( function() {
                SELF.clear();
            } );
        }
    };
    FancyCalendar.api.addEvents   = function() {
        var SELF = this;
        if( SELF.templates.event && SELF.templates.weekCalendar ) {
            this._events = [];
            this.events.forEach( function( event, i ) {
                var tpl = SELF.templates.event.clone();
                SELF._events.push( Fancy( tpl ).template( { scope: event } ).compile() );
                $( SELF.skeleton.body.find( "." + NAME + "-events-day" )[ event.startDate.getDay() - 1 ] ).append( tpl );
            } );
            this.styleEvents();
        } else {
            SETTINGS[ this.id ].outstandingEvents = function() {
                SELF.addEvents();
            };
        }
    };
    FancyCalendar.api.styleEvents = function() {
        var SELF       = this,
            fullHeight = this.skeleton.body.height();
        this.events.forEach( function( it, index ) {
            console.log( it, it[ SELF.settings.eventEndField ].getHours() - it[ SELF.settings.eventStartField ].getHours() );
            SELF._events[ index ].element.css( {
                top: fullHeight / 24 * it[ SELF.settings.eventStartField ].getHours()
            } );
            SELF._events[ index ].element.height( fullHeight / 24 * (it[ SELF.settings.eventEndField ].getHours() - it[ SELF.settings.eventStartField ].getHours()) )
        } );
    };

    Fancy.settings [ NAME ] = {
        templatePath   : "templates/",
        weekTemplate   : "weekCalendar.html",
        eventTemplate  : "event.html",
        eventStartField: "startDate",
        eventEndField  : "endDate"
    };


    Fancy.api.weekCalendar = function( settings ) {
        return this.set( NAME, function( el ) {
            return new FancyCalendar( el, settings );
        }, false );
    };

})( jQuery, Fancy );
