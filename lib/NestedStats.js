/*
	Stats Modifiers

	Copyright (c) 2021 Cédric Ronvel

	The MIT License (MIT)

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.
*/

"use strict" ;



function NestedStats( stats = null , parentTable = null , pathKey = null , clone = false ) {
	this[ common.SYMBOL_PARENT ] = parentTable ;
	this.pathKey = pathKey ;
	this.stats = {} ;

	this.proxy = null ;

	if ( stats ) { this.setStats( stats , clone ) ; }
}

module.exports = NestedStats ;



const Stat = require( './Stat.js' ) ;
const common = require( './common.js' ) ;
const arrayKit = require( 'array-kit' ) ;



NestedStats.prototype.clear = function() {
	common.clearObject( this.stats ) ;
} ;



NestedStats.prototype.setStats = function( stats , clone = true ) {
	if ( ! common.isNested( stats ) ) { return ; }
	if ( stats instanceof NestedStats ) { stats = stats.stats ; }
	for ( let statName in stats ) { this.setStat( statName , stats[ statName ] , clone ) ; }
} ;



NestedStats.prototype.setStat = function( statName , statValue , clone = true ) {
	var pathKey = this.pathKey ? this.pathKey + '.' + statName : statName ;

	//console.log( ".setStat():" , statName , statValue , clone ) ;
	//console.log( ".setStat():" , statName , clone ) ;

	if ( statValue === null ) {
		//console.log( "\t| DELETED" ) ;
		delete this.stats[ statName ] ;
		return true ;
	}

	if ( common.isNested( statValue ) ) {
		// Nested stats
		if ( ! this.stats[ statName ] ) {
			if ( statValue instanceof NestedStats ) {
				if ( clone ) {
					//console.log( "\t| null <-- NestedStats ©" ) ;
					this.stats[ statName ] = statValue.clone( this[ common.SYMBOL_PARENT ] , pathKey ) ;
					return true ;
				}

				//console.log( "\t| null <-- NestedStats" ) ;
				this.stats[ statName ] = statValue ;
				this.stats[ statName ][ common.SYMBOL_PARENT ] = this[ common.SYMBOL_PARENT ] ;
				this.stats[ statName ].pathKey = pathKey ;
				return true ;
			}

			//console.log( "\t| null <-- Object" + ( clone ? ' ©' : '' ) ) ;
			this.stats[ statName ] = new NestedStats( statValue , this[ common.SYMBOL_PARENT ] , pathKey , clone ) ;
			return true ;
		}

		if ( this.stats[ statName ] instanceof NestedStats ) {
			//this.stats[ statName ].clear() ;	// This would cause trouble when deep-extending...

			if ( statValue instanceof NestedStats ) {
				//console.log( "\t| NestedStats <-- NestedStats ©" ) ;
				this.stats[ statName ].setStats( statValue.stats ) ;
				return true ;
			}

			//console.log( "\t| NestedStats <-- Object ©" ) ;
			this.stats[ statName ].setStats( statValue ) ;
			return true ;
		}

		// Uncompatible: drop it (or error?)
		//console.log( "\t| NestedStats <-- UNCOMPATIBLE" ) ;
		return false ;
	}

	if ( ! this.stats[ statName ] ) {
		//console.log( "\t| null <-- any stat" ) ;
		this.stats[ statName ] = Stat.create( this[ common.SYMBOL_PARENT ] , pathKey , statValue , clone ) ;
		return true ;
	}

	if ( this.stats[ statName ] instanceof Stat ) {
		//console.log( "\t| Stat <-- any stat" ) ;
		this.stats[ statName ].set( statValue ) ;
		return true ;
	}

	// drop?
	//console.log( "\t| Stat <-- UNCOMPATIBLE" ) ;
	return false ;
} ;



NestedStats.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new NestedStats( this.stats , parentTable , pathKey , true ) ;
} ;



// Check if a stat path is correct: it points to a Stat or to an intermediate object with wildcard support
// If getDetails = true, it returns an array of the pointed [ parentNode , node ]
NestedStats.prototype.checkPath = function( pathArray , getDetails = false , depth = 0 ) {
	var index , indexMax , key ,
		node ,
		parent = null ,
		pointerParent = null ,
		pointer = this.stats ;

	for ( index = 0 , indexMax = pathArray.length ; index < indexMax ; index ++ ) {
		key = pathArray[ index ] ;
		node = pointer[ key ] ;
		//console.error( "Pass #" + index , key , node , parent ) ;
		//if ( parent ) { console.error( "\t" , parent.pathKey , parent.hasCustomChildren ) ; }

		if ( ! node ) {
			if ( index === indexMax - 1 && parent?.hasCustomChildren ) {
				break ;
			}
			else if ( pointer['*'] ) {
				node = pointer['*'] ;
			}
			else {
				return false ;
			}
		}
		pointerParent = pointer ;
		pointer = node ;
		parent = node ;
	}

	//console.error( "checkPath:" , node instanceof Stat , parent instanceof Stat , parent?.hasCustomChildren , parent?.innerMods?.has( key ) , node?.['*'] ) ;
	var isOk =
		( node instanceof Stat )
		|| ( ( parent instanceof Stat ) && ( parent.hasCustomChildren || parent.innerMods.has( key ) ) )
		|| node['*'] !== undefined ;

	if ( ! isOk ) { return false ; }
	if ( ! getDetails ) { return true ; }

	return {
		parent , node , key ,
		parentPath: path.slice( 0 , path.length - key.length - 1 )
	} ;
} ;



NestedStats.prototype.getProxy = function() {
    if ( this.proxy ) { return this.proxy ; }
    this.proxy = new Proxy( this , NESTED_HANDLER ) ;
    return this.proxy ;
} ;

// ...args is for derivated class
NestedStats.prototype.cloneProxy = function( ... args ) { return this.clone( ... args ).getProxy() ; } ;



const NESTED_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return Object ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return target.cloneProxy.bind( target ) ; }

		var finalTarget = target.stats[ property ] ;
		if ( ! finalTarget ) { return ; }

		/*
		console.log( "??? t:" , target ) ;
		console.log( "??? p:" , property ) ;
		console.log( "??? t[p]:" , target.stats[ property ] ) ;
		//*/

		if ( finalTarget.getProxy ) { return finalTarget.getProxy() ; }
		if ( typeof finalTarget === 'function' ) { return finalTarget.bind( target ) ; }
		return finalTarget ;
	} ,
	set: ( target , property , value , receiver ) => {
		return target.setStat( property , value ) ;
	}
} ;

NestedStats.NESTED_HANDLER = NESTED_HANDLER ;

