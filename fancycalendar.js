(function( $, Fancy ) {

    var NAME      = "FancyCalendar",
        logged    = false,
        VERSION   = "0.0.1",
        SETTINGS  = [],
        id        = 0,
        templates = [];
    Fancy.install( "criteria", "0.0.2" );
    Fancy.install( "template", "0.0.3" );
    Fancy.install( "promise", "0.0.1" );

    function replaceWith( el, template ) {

        var attributes = Array.prototype.slice.call( el[ 0 ].attributes );
        el.replaceWith( template );
        attributes.forEach( function( it ) {
            template.attr( it.name, it.nodeValue );
        } );
        return template;
    }

    function unique( array, key ) {
        var flags = [], output = [], l = array.length, i;
        for( i = 0; i < l; i++ ) {
            if( array.hasOwnProperty( i ) ) {
                var k = Fancy.getKey( array[ i ], key );
                if( flags[ k ] ) {
                    continue;
                }
                flags[ k ]  = true;
                output[ i ] = ( array[ i ] );
            }
        }
        return output;
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
            eventID: 0
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
        this.events.sort( function( a, b ) {
            var aS = a[ SELF.settings.eventStartField ],
                bS = b[ SELF.settings.eventStartField ],
                aE = a[ SELF.settings.eventEndField ],
                bE = b[ SELF.settings.eventEndField ];

            // a starts
            if( aS < bS ) {
                if( aE < bE && aS + aE <= bS + bE ) {
                    console.log( "%s will be after %s", a.name, b.name );
                    //return 1
                }
                return -1;
            } else if( aS > bS ) {
                return 1;
            }
            return 0;
        } );
        this.clear();
        this.addEvents();
        return this;
    };

    FancyCalendar.api.clear     = function() {
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
    FancyCalendar.api.addEvents = function() {
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

        function getOverlap( event ) {

            function search( it ) {
                var start                            = new Date( event[ SELF.settings.eventStartField ] ),
                    end                              = new Date( event[ SELF.settings.eventEndField ] );
                var criteria                         = Fancy.criteria( SELF.events );
                var criteriaStartEarlierAndEndInTime = criteria.copy(),
                    criteriaStartLaterAndEndLater    = criteria.copy(),
                    criteriaStartLaterAndEndInTime   = criteria.copy();
                // event starts earlier than this
                criteriaStartEarlierAndEndInTime.and( Fancy.criteria.LOWER_THAN_EQUALS, SELF.settings.eventStartField, start.getTime() );
                // event ends later than this
                criteriaStartEarlierAndEndInTime.and( Fancy.criteria.GREATER_THAN, SELF.settings.eventEndField, start.getTime() );


                // event event starts later than this
                criteriaStartLaterAndEndLater.and( Fancy.criteria.GREATER_THAN_EQUALS, SELF.settings.eventStartField, start.getTime() );
                // event starts earlier than this ends
                criteriaStartLaterAndEndLater.and( Fancy.criteria.LOWER_THAN, SELF.settings.eventStartField, end.getTime() );
                // event ends later than this
                criteriaStartLaterAndEndLater.and( Fancy.criteria.GREATER_THAN, SELF.settings.eventEndField, end.getTime() );


                // event starts later than this
                criteriaStartLaterAndEndInTime.and( Fancy.criteria.GREATER_THAN_EQUALS, SELF.settings.eventStartField, start.getTime() );
                // event ends earlier than this
                criteriaStartLaterAndEndInTime.and( Fancy.criteria.LOWER_THAN_EQUALS, SELF.settings.eventEndField, end.getTime() );
                criteriaStartLaterAndEndLater    = criteriaStartLaterAndEndLater.list( true );
                criteriaStartEarlierAndEndInTime = criteriaStartEarlierAndEndInTime.list( true );
                criteriaStartLaterAndEndInTime   = criteriaStartLaterAndEndInTime.list( true );
                var list                         = [];
                criteriaStartEarlierAndEndInTime.forEach( function( a, b ) {
                    list[ b ] = a;
                } );
                criteriaStartLaterAndEndLater.forEach( function( a, b ) {
                    list[ b ] = a;
                } );
                criteriaStartLaterAndEndInTime.forEach( function( a, b ) {
                    list[ b ] = a;
                } );
                return list;
            }

            var eventList  = search( event ),
                eventChild = [];
            eventList.forEach( function( it ) {
                search( it ).forEach( function( a, b ) {
                    eventChild[ b ] = a;
                } );
            } );
            eventChild.forEach( function( a, b ) {
                eventList[ b ] = a;
            } );
            return unique( eventList, "$id" );
        }

        this.events.forEach( function( it, index ) {
            SELF._events[ index ].element.css( {
                top: (fullHeight / 24 * it[ SELF.settings.eventStartField ].getHours()) + (fullHeight / 1440 * (it[ SELF.settings.eventStartField ].getMinutes()))
            } );
            var eventList = getOverlap( it );
            var l         = 0;
            eventList.forEach( function() {
                l++;
            } );
            var c = 0;
            eventList.forEach( function( ev, i ) {
                SELF._events[ i ].element.css( {
                    left : ((100 / l) * c) + "%",
                    width: (100 / l) + "%"
                } );
                c++;
            } );
            //console.log( it.name, eventList, criteriaStartEarlierAndEndInTime, criteriaStartLaterAndEndLater, criteriaStartLaterAndEndInTime );
            var hours   = fullHeight / 24 * (it[ SELF.settings.eventEndField ].getHours() - it[ SELF.settings.eventStartField ].getHours()),
                minutes = fullHeight / 1440 * (it[ SELF.settings.eventEndField ].getMinutes() - it[ SELF.settings.eventStartField ].getMinutes()),
                height  = hours + minutes;
            SELF._events[ index ].element.height( height )
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
