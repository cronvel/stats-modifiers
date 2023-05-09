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



function NestedStats( stats = null , parentTable = null , pathKey = null ) {
	this[ common.SYMBOL_PARENT ] = parentTable ;
	this.pathKey = pathKey ;

	this.stats = {} ;

	this.proxy = null ;
	this.pathToProxy = {} ;	// Key: path, value: proxy

	if ( stats ) { this.setStats( stats , clone ) ; }
}

module.exports = NestedStats ;



const Stat = require( './Stat.js' ) ;
const common = require( './common.js' ) ;
const arrayKit = require( 'array-kit' ) ;



NestedStats.prototype.setStats = function( stats , clone = false ) {
	for ( let statName in stats ) { this.setStat( statName , stats[ statName ] , undefined , clone ) ; }
} ;



NestedStats.prototype.setStat = function( statName , params , pointer = this.stats , pathKey = null , clone = false ) {
	pathKey = pathKey ? pathKey + '.' + statName : statName ;

	if ( params === null ) {
		delete pointer[ statName ] ;
	}
	else if ( common.isNested( params ) ) {
		// Nested stats
		if ( pointer[ statName ] && ( pointer[ statName ] instanceof Stat ) ) {
			// Uncompatible: drop it (or error?)
			return false ;
		}

		if ( ! pointer[ statName ] ) {
			pointer[ statName ] = {} ;
			pointer[ statName ][ common.SYMBOL_PARENT ] = this[ common.SYMBOL_PARENT ] ;
		}

		Object.keys( params ).forEach( key => {
			if ( params['*'] && key !== '*' ) {
				// If there is a wildcard, it should be added to all nested stats FIRST,
				// since it's used as a template, and then be updated by the base value.
				this.setStat( key , params['*'] , pointer[ statName ] , pathKey , true ) ;
			}

			this.setStat( key , params[ key ] , pointer[ statName ] , pathKey , clone ) ;
		} ) ;
	}
	else {
		if ( pointer[ statName ] ) {
			if ( pointer[ statName ] instanceof Stat ) { pointer[ statName ].set( params ) ; }
			else { return false ; }	// drop?
		}
		else {
			pointer[ statName ] = Stat.create( this[ common.SYMBOL_PARENT ] , pathKey , params , clone ) ;
		}
	}

	return true ;
} ;



NestedStats.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
    return new NestedStats( this.stats , parentTable , pathKey ) ;
} ;



// Check if a stat path is correct: it points to a Stat or to an intermediate object with wildcard support
// If getDetails = true, it returns an array of the pointed [ parentNode , node ]
NestedStats.prototype.checkPath = function( path , getDetails = false ) {
	var index , indexMax , key ,
		pathArray = path.split( '.' ) ,
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

		if ( ! target.stats[ property ] ) { return ; }

		return target.stats[ property ].getProxy() ;
	} ,
	set: ( target , property , value , receiver ) => {
		return target.setStat( property , value ) ;
	}
} ;

NestedStats.NESTED_HANDLER = NESTED_HANDLER ;

