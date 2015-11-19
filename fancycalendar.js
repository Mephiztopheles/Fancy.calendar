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
        this.element  = el;
        this.events   = [];
        this.id       = id++;
        this.settings = $.extend( {}, Fancy.settings [ NAME ], settings );
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

        var p1        = Fancy.promise(),
            p2        = Fancy.promise();
        this.promises = [];
        if( Fancy.template ) {
            this.promises.push( p1, p2 );
            Fancy.loadTemplate( weekCalendar )( function( template ) {
                SELF.templates.weekCalendar = template;
                SELF.element                = replaceWith( el, template );
                p1.resolve();
            } );
            Fancy.loadTemplate( event )( function( template ) {
                SELF.templates.event = template;
                p2.resolve();
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
                        p1.resolve();
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
                        p2.resolve();
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
        this.promises[ 0 ].then( function() {
            SELF.skeleton = {
                head: SELF.element.find( "." + NAME + "-head" ),
                body: SELF.element.find( "." + NAME + "-events-body" ).html( "" )
            };
            var i         = 0;
            while( i < 7 ) {
                i++;
                SELF.skeleton.body.append( $( "<div/>", { "class": NAME + "-events-day" } ) );
            }
        } );
    };
    FancyCalendar.api.addEvents   = function() {
        var SELF = this;
        Fancy.promise.all( this.promises ).then( function() {
            SELF._events = [];
            SELF.events.forEach( function( event, i ) {
                var tpl = SELF.templates.event.clone();
                SELF._events.push( Fancy( tpl ).template( { scope: event } ).compile() );
                $( SELF.skeleton.body.find( "." + NAME + "-events-day" )[ event.startDate.getDay() - 1 ] ).append( tpl );
            } );
            SELF.styleEvents();
        } );
    };
    FancyCalendar.api.styleEvents = function() {
        var SELF       = this,
            fullHeight = this.skeleton.body.height();
        this.events.forEach( function( it, index ) {
            var start = new Date( it[ SELF.settings.eventStartField ] ),
                end   = new Date( it[ SELF.settings.eventEndField ] );
            console.log( it, end.getHours() - start.getHours() );
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
