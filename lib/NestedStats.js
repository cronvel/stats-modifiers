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

	this.proxy = {} ;

	if ( stats ) { this.setStats( stats , clone ) ; }
}

module.exports = NestedStats ;



const Stat = require( './Stat.js' ) ;
const common = require( './common.js' ) ;



NestedStats.prototype.operandType = null ;
NestedStats.prototype.specialKeys = new Set() ;



NestedStats.prototype.clear = function() {
	common.clearObject( this.stats ) ;
} ;



NestedStats.prototype.setFromNestedStats = function( nestedStats , clone = true ) {
	this.setStats( nestedStats.stats , clone ) ;
} ;



NestedStats.prototype.setStats = function( statsSource , clone = true ) {
	if ( ! common.isNested( statsSource ) ) { return ; }

	var sourceSpecialKeys ,
		stats = statsSource ;

	if ( statsSource instanceof NestedStats ) {
		stats = stats.stats ;
		sourceSpecialKeys = this.specialKeys ;
	}

	for ( let statName in stats ) {
		if ( ! this.specialKeys.has( statName ) && ( ! sourceSpecialKeys || ! sourceSpecialKeys.has( statName ) ) ) {
			this.setStat( statName , stats[ statName ] , clone ) ;
		}
	}
} ;



NestedStats.prototype.setStat = function( statName , statValue , clone = true , selfBase = this.stats ) {
	var pathKey = this.pathKey ? this.pathKey + '.' + statName : statName ;

	//console.log( ".setStat():" , statName , statValue , clone ) ;
	//console.log( ".setStat():" , statName , clone ) ;

	if ( statValue === null ) {
		//console.log( "\t| DELETED" ) ;
		delete selfBase[ statName ] ;
		return true ;
	}

	// In some configuration (e.g. in KFG), it is possible that the proxy is passed instead of the real instance
	statValue = statValue?.[ common.SYMBOL_UNPROXY ] || statValue ;

	if ( common.isNested( statValue ) ) {
		// Nested stats
		if ( ! selfBase[ statName ] ) {
			if ( statValue instanceof NestedStats ) {
				if ( clone ) {
					//console.log( "\t| null <-- NestedStats ©" ) ;
					selfBase[ statName ] = statValue.clone( this[ common.SYMBOL_PARENT ] , pathKey ) ;
					return true ;
				}

				//console.log( "\t| null <-- NestedStats" ) ;
				selfBase[ statName ] = statValue ;
				statValue.fixAttachment( this , statName ) ;
				return true ;
			}

			//console.log( "\t| null <-- Object" + ( clone ? ' ©' : '' ) ) ;
			selfBase[ statName ] = new NestedStats( statValue , this[ common.SYMBOL_PARENT ] , pathKey , clone ) ;
			return true ;
		}

		if ( selfBase[ statName ] instanceof NestedStats ) {
			//selfBase[ statName ].clear() ;	// This would cause trouble when deep-extending...

			if ( statValue instanceof NestedStats ) {
				//console.log( "\t| NestedStats <-- NestedStats ©" ) ;
				//selfBase[ statName ].setStats( statValue.stats ) ;
				selfBase[ statName ].setFromNestedStats( statValue.stats ) ;
				return true ;
			}

			//console.log( "\t| NestedStats <-- Object ©" ) ;
			selfBase[ statName ].setStats( statValue ) ;
			return true ;
		}

		// Uncompatible: drop it (or error?)
		//console.log( "\t| NestedStats <-- UNCOMPATIBLE" ) ;
		return false ;
	}

	if ( ! selfBase[ statName ] ) {
		//console.log( "\t| null <-- any stat" ) ;
		selfBase[ statName ] = Stat.create( this[ common.SYMBOL_PARENT ] , pathKey , statValue , clone ) ;
		return true ;
	}

	if ( selfBase[ statName ] instanceof Stat ) {
		//console.log( "\t| Stat <-- any stat" ) ;
		selfBase[ statName ].set( statValue ) ;
		return true ;
	}

	// drop?
	//console.log( "\t| Stat <-- UNCOMPATIBLE" ) ;
	return false ;
} ;



NestedStats.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new NestedStats( this.stats , parentTable , pathKey , true ) ;
} ;



// Used when reassigning to a new parent
NestedStats.prototype.fixAttachment = function( to , key ) {
	if ( ! to[ common.SYMBOL_PARENT ] ) { return ; }

	var pathKey = to.pathKey ? to.pathKey + '.' + key : key ;

	if ( this[ common.SYMBOL_PARENT ] === to[ common.SYMBOL_PARENT ] && this.pathKey === pathKey ) { return ; }

	this[ common.SYMBOL_PARENT ] = to[ common.SYMBOL_PARENT ] ;
	this.pathKey = pathKey ;
	this.proxy = {} ;

	for ( let property in this.stats ) {
		this.stats[ property ].fixAttachment( this , property ) ;
	}
} ;



// Check if a stat path is correct: it points to a Stat or to an intermediate object with wildcard support
// If getDetails = true, it returns an object { target , parent , key , parentPath }
NestedStats.prototype.checkModifiablePath = function( pathArray , getDetails = false , depth = 0 ) {
	if ( depth >= pathArray.length ) { return false ; }

	var isOk ,
		parent = this ,
		key = pathArray[ depth ] ,
		target = this.stats[ key ] ;

	if ( depth === pathArray.length - 1 ) {
		// This is the last part
		if ( target instanceof Stat ) { isOk = true ; }
		else if ( this.hasWildChildren ) { isOk = true ; }
		else { isOk = false ; }
	}
	else {
		if ( target instanceof Stat ) {
			if ( target.hasWildChildren && depth === pathArray.length - 2 ) {
				isOk = true ;
				parent = target ;
				key = pathArray[ depth + 1 ] ;
			}
			else {
				isOk = false ;
			}
		}
		else if ( target instanceof NestedStats ) {
			return target.checkModifiablePath( pathArray , getDetails , depth + 1 ) ;
		}
		else if ( this.hasWildChildren && this[ this.wildBranch ] ) {
			let wildTarget = this[ this.wildBranch ] ;

			if ( wildTarget instanceof Stat ) {
				if ( wildTarget.hasWildChildren && depth === pathArray.length - 2 ) {
					isOk = true ;
					parent = wildTarget ;
					key = pathArray[ depth + 1 ] ;
				}
				else {
					isOk = false ;
				}
			}
			else if ( wildTarget instanceof NestedStats ) {
				return wildTarget.checkModifiablePath( pathArray , getDetails , depth + 1 ) ;
			}
			else {
				isOk = false ;
			}
		}
		else {
			isOk = false ;
		}
	}

	if ( ! isOk ) { return false ; }
	if ( ! getDetails ) { return true ; }

	pathArray.length -- ;
	let parentPath = pathArray.join( '.' ) ;

	return { parent , key , parentPath } ;
} ;



NestedStats.prototype.getProxy = function( pathKey = this.pathKey ) {
	if ( this.proxy[ pathKey ] ) { return this.proxy[ pathKey ] ; }
	return this.proxy[ pathKey ] = new Proxy( { target: this , pathKey } , NESTED_HANDLER ) ;
} ;

// ...args is for derivated class
NestedStats.prototype.cloneProxy = function( ... args ) { return this.clone( ... args ).getProxy() ; } ;



const NESTED_HANDLER = {
	get: ( { target , pathKey } , property ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === common.SYMBOL_PATH_KEY ) { return pathKey ; }		// Debug and unit test
		if ( property === 'constructor' ) { return Object ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return target.cloneProxy.bind( target ) ; }

		var finalTarget = target.stats[ property ] ;
		if ( ! finalTarget ) { return ; }

		/*
		console.log( "property:" , property ) ;
		console.log( "pathKey:" , pathKey ) ;
		console.log( "next pathKey:" , pathKey ? pathKey + '.' + property : property ) ;
		console.log( "target:" , target ) ;
		console.log( "finalTarget:" , finalTarget ) ;
		console.log( "finalTarget.getProxy:" , finalTarget.getProxy ) ;
		//*/

		if ( finalTarget?.getProxy ) {
			return finalTarget.getProxy( pathKey ? pathKey + '.' + property : property ) ;
		}

		if ( typeof finalTarget === 'function' ) { return finalTarget.bind( target ) ; }
		return finalTarget ;
	} ,
	// Mostly a copy of .get()
	has: ( { target } , property ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return true ; }
		if ( property === common.SYMBOL_PATH_KEY ) { return true ; }		// Debug and unit test
		if ( property === 'constructor' ) { return true ; }
		if ( property === 'toString' ) { return true ; }
		if ( property === 'clone' ) { return true ; }
		return property in target.stats ;
	} ,
	set: ( { target } , property , value ) => {
		return target.setStat( property , value ) ;
	} ,
	deleteProperty: ( { target } , property ) => {
		if ( ! ( property in target.stats ) ) { return false ; }
		return delete target.stats[ property ] ;
	} ,
	ownKeys: ( { target } ) => [ ... Object.keys( target.stats ) ] ,
	getOwnPropertyDescriptor: ( { target , pathKey } , property ) => {
		//console.error( ".getOwnPropertyDescriptor() triggered!" , property ) ;
		if ( ! property || typeof property !== 'string' ) { return ; }

		var finalTarget = target.stats[ property ] ;
		if ( ! finalTarget ) { return ; }

		return {
			value: finalTarget?.getProxy ? finalTarget.getProxy( pathKey ? pathKey + '.' + property : property ) : finalTarget ,
			writable: true ,
			// Mandatory, for some reasons .ownKeys() is always cross-checking each props using getOwnPropertyDescriptor().enumerable
			enumerable: true ,
			configurable: true
		} ;
	} ,
	getPrototypeOf: ( { target } ) => Reflect.getPrototypeOf( target ) ,
	setPrototypeOf: () => false
} ;

NestedStats.NESTED_HANDLER = NESTED_HANDLER ;

