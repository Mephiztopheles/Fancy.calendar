(function( $ ) {

    Fancy.require( {
        jQuery: false,
        Fancy : "1.0.6"
    } );
    var id            = 0,
        NAME          = "FancyTemplate",
        VERSION       = "1.0.0",
        templateCache = {},
        logged        = false;

    function FancyTemplate( $el, settings ) {
        var SELF      = this;
        this.element  = $el;
        this.template = $el.html();
        this.settings = $.extend( {}, Fancy.settings [ NAME ], settings );
        this.id       = id++;
        this.parsed   = [];
        if( !logged ) {
            logged = true;
            Fancy.version( SELF );
        }

        return this;
    }

    FancyTemplate.api = FancyTemplate.prototype = {};
    FancyTemplate.api.version = VERSION;
    FancyTemplate.api.name    = NAME;
    FancyTemplate.api.update  = function( scope ) {
        var SELF = this;
        if( scope )
            SELF.settings.scope = scope;
        console.log( this.settings.scope );
        $( SELF.parsed ).each( function() {
            $( this ).html( SELF.settings.scope[ $( this ).data( "$value" ) ] );
        } );
        return this;
    };
    FancyTemplate.api.parse   = function() {
        var SELF = this,
            tpl  = $( this.template );

        function parseTemplate( it ) {
            console.log( it.text().trim() );
            it.data( "$value", it.text().trim() );
            it.html( it.html().replace( it.text().trim(), SELF.settings.scope[ it.data( "$value" ) ] ) );
            return it;
        }

        console.log( SELF.settings.scope );
        tpl.filter( "." + SELF.settings.bindClass ).each( function() {
            SELF.parsed.push( parseTemplate( $( this ) ) );
        } );
        return tpl;
    };
    FancyTemplate.api.compile = function() {
        var SELF   = this,
            l      = this.settings.leftDelimiter,
            r      = this.settings.rightDelimiter,
            allBut = "[^" + l[ 0 ] + r[ r.length - 1 ] + "]*";

        function compile() {
            SELF.template = SELF.template.replace( new RegExp( "<([^>]*)>(\\s*)" + l + "(" + allBut + ")" + r + "(\\s*)<", "gm" ), function( match, el, before, exp, after ) {
                if( el.indexOf( "script" ) === 0 )
                    return;
                var tag;
                if( el.match( /class=["|']/ ) ) {
                    tag = el.replace( /class="([^"]*)"/, function( match, $1 ) {
                        return "class=\"" + $1 + " " + SELF.settings.bindClass + "\"";
                    } );
                } else {
                    tag = el + " class=\"" + SELF.settings.bindClass + "\"";
                }
                return '<' + tag + '>' + before + exp + after + '<';
            } );
            SELF.template = SELF.template.replace( new RegExp( l + "(" + allBut + ")" + r, "g" ), function( match, $1 ) {
                return '<span class="' + SELF.settings.bindClass + '">' + $1.trim() + '</span>';
            } );

            SELF.element.html( SELF.parse() );
        }

        if( this.template ) {
            compile();
        } else {
            setTimeout( compile, 40 );
        }
        return this;
    };

    Fancy.settings [ NAME ] = {
        scope         : {},
        leftDelimiter : "{{",
        rightDelimiter: "}}",
        bindClass     : NAME + "-bindings"
    };

    Fancy.loadTemplate = function( url ) {
        var success = function() {},
            error   = function() {};
        if( templateCache[ url ] ) {
            setTimeout( function() {
                success( templateCache[ url ].clone() );
            }, 1 );
        } else {
            $.ajax( {
                url    : url,
                global : false,
                success: function( html ) {
                    if( html.indexOf( "<" ) !== 0 ) {
                        html                 = "<span>" + html + "</span>";
                        templateCache[ url ] = $( $( html ) );
                    } else {
                        templateCache[ url ] = $( html );
                    }
                    success( templateCache[ url ].clone() );
                },
                error  : function() {
                    error.call( this, arguments );
                }
            } );
        }

        return function( then, not ) {
            success = then;
            error   = not;
        };
    };
    Fancy.template     = VERSION;
    Fancy.api.template = function( settings ) {
        return this.set( NAME, function( el ) {
            return new FancyTemplate( el, settings );
        }, false );
    };

})( jQuery );