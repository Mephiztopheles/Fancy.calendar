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
        this.element   = el;
        this.events    = [];
        this.id        = id++;
        this.settings  = $.extend( {}, Fancy.settings [ NAME ], settings );
        var SELF       = this,
            calendar   = SELF.settings.templatePath + "calendar.html",
            event      = SELF.settings.templatePath + "event.html";
        this.templates = {
            calendar: templates[ calendar ],
            event   : templates[ event ]
        };

        SETTINGS[ this.id ] = {
            outstandingEvents: function() { },
            delayedFunctions : [],
            eventID          : 0
        };

        if( Fancy.template ) {
            Fancy.loadTemplate( calendar )( function( template ) {
                SELF.templates.calendar = template;
                SELF.element            = replaceWith( el, template );
                SETTINGS[ SELF.id ].delayedFunctions.forEach( function( it ) {
                    it();
                } );
            } );
            Fancy.loadTemplate( event )( function( template ) {
                SELF.templates.event = template;
                SETTINGS[ SELF.id ].outstandingEvents();
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
                        SETTINGS[ SELF.id ].delayedFunctions.forEach( function( it ) {
                            it();
                        } );
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

    FancyCalendar.api.clear     = function() {
        var SELF = this;
        if( SELF.templates.calendar ) {
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
    FancyCalendar.api.addEvents = function() {
        var SELF = this;
        if( SELF.templates.event && SELF.templates.calendar ) {
            this._events = [];
            this.events.forEach( function( event, i ) {
                var tpl = SELF.templates.event.clone();
                SELF._events.push( Fancy( tpl ).template( { scope: event } ).compile() );
                $( SELF.skeleton.body.find( "." + NAME + "-events-day" )[ event.startDate.getDay() - 1 ] ).append( tpl );
            } );
        } else {
            SETTINGS[ this.id ].outstandingEvents = function() {
                SELF.addEvents();
            };
        }
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
