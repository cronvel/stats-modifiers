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



function StatsTable( stats = null , clone = false ) {
	this.nestedStats = new NestedStats( null , this , '' ) ;
	this.modifiersTables = [] ;	// list of modifiersTable of the StatsTable
	this.statsModifiers = {} ;	// per stat modifier list (key is a key's full path)
	this.wildChildrenModifierKeys = {} ;

	this.proxy = null ;

	if ( stats ) { this.setStats( stats , clone ) ; }
}

module.exports = StatsTable ;



const Stat = require( './Stat.js' ) ;
const NestedStats = require( './NestedStats.js' ) ;
const Modifier = require( './Modifier.js' ) ;
const ModifiersTable = require( './ModifiersTable.js' ) ;

const common = require( './common.js' ) ;

const arrayKit = require( 'array-kit' ) ;



StatsTable.prototype.setStats = function( stats , clone = true ) {
	this.nestedStats.setStats( stats , clone ) ;
} ;



StatsTable.prototype.clone = function() {
	return new StatsTable( this.nestedStats , true ) ;
} ;

StatsTable.prototype.cloneProxy = function() { return this.clone().getProxy() ; } ;



// Clone then extend with stats
StatsTable.prototype.extend = function( stats ) {
	var statsTable = this.clone() ;
	statsTable.setStats( stats ) ;
	return statsTable ;
} ;

StatsTable.prototype.extendProxy = function( stats ) { return this.extend( stats ).getProxy() ; } ;



StatsTable.prototype.stack = function( modifiersTable ) {
	var statName , op , modifier ;

	if ( modifiersTable[ common.SYMBOL_UNPROXY ] ) { modifiersTable = modifiersTable[ common.SYMBOL_UNPROXY ] ; }
	if ( ! ( modifiersTable instanceof ModifiersTable ) ) { throw new Error( 'Not a ModifiersTable' ) ; }

	if ( modifiersTable.isTemplate ) {
		modifiersTable = modifiersTable.instanciate() ;
	}
	else if ( modifiersTable.stackedOn ) {
		if ( modifiersTable.stackedOn !== this ) {
			// Is it an error?
			// Should we unstack it from the statsTable it is stacked on?
			// Should we just exit now?
			//return false ;
			modifiersTable.stackedOn.unstack( modifiersTable ) ;
		}
		else {
			return false ;
		}
	}

	modifiersTable.stackedOn = this ;
	this.modifiersTables.push( modifiersTable ) ;

	for ( statName in modifiersTable.statsModifiers ) {
		//if ( ! this.checkModifiablePath( statName ) ) { continue ; }
		//console.error( "statName:" , statName ) ;
		let details = this.checkModifiablePath( statName , true ) ;
		//console.error( "details:" , details ) ;
		if ( ! details ) { continue ; }

		for ( op in modifiersTable.statsModifiers[ statName ] ) {
			modifier = modifiersTable.statsModifiers[ statName ][ op ] ;
			if ( ! this.statsModifiers[ statName ] ) { this.statsModifiers[ statName ] = [] ; }
			this.statsModifiers[ statName ].push( modifier ) ;
		}

		if ( this.statsModifiers[ statName ] && this.statsModifiers[ statName ].length ) {
			this.statsModifiers[ statName ].sort( Modifier.sortFn ) ;
		}

		if ( details.parent?.hasWildChildren ) {
			if ( ! this.wildChildrenModifierKeys[ details.parentPath ] ) { this.wildChildrenModifierKeys[ details.parentPath ] = {} ; }
			let modifiersForKey = this.wildChildrenModifierKeys[ details.parentPath ][ details.key ] ;
			if ( ! modifiersForKey ) { modifiersForKey = this.wildChildrenModifierKeys[ details.parentPath ][ details.key ] = [] ; }
			modifiersForKey.push( modifier ) ;
		}
	}

	return true ;
} ;



StatsTable.prototype.unstack = function( modifiersTable ) {
	var index ;

	if ( modifiersTable[ common.SYMBOL_UNPROXY ] ) { modifiersTable = modifiersTable[ common.SYMBOL_UNPROXY ] ; }

	if ( modifiersTable instanceof ModifiersTable ) {
		index = this.modifiersTables.indexOf( modifiersTable ) ;
		if ( index === -1 ) { return ; }
		arrayKit.delete( this.modifiersTables , index ) ;
	}
	else if ( typeof modifiersTable === 'string' ) {
		// Delete by ID
		index = this.modifiersTables.findIndex( e => e.id === modifiersTable ) ;
		if ( index === -1 ) { return ; }
		modifiersTable = this.modifiersTables[ index ] ;
		arrayKit.delete( this.modifiersTables , index ) ;
	}

	this.afterUnstack( modifiersTable ) ;

	modifiersTable.stackedOn = null ;
} ;



StatsTable.prototype.afterUnstack = function( modifiersTable ) {
	var statName , op , modifier ;

	for ( statName in modifiersTable.statsModifiers ) {
		//if ( ! this.checkModifiablePath( statName ) ) { continue ; }
		let details = this.checkModifiablePath( statName , true ) ;
		if ( ! details ) { continue ; }

		for ( op in modifiersTable.statsModifiers[ statName ] ) {
			modifier = modifiersTable.statsModifiers[ statName ][ op ] ;
			arrayKit.deleteValue( this.statsModifiers[ statName ] , modifier ) ;
			if ( ! this.statsModifiers[ statName ].length ) {
				delete this.statsModifiers[ statName ] ;
			}
		}

		if ( details.parent?.hasWildChildren ) {
			let modifiersForKey = this.wildChildrenModifierKeys[ details.parentPath ][ details.key ] ;

			if ( modifiersForKey ) {
				arrayKit.deleteValue( modifiersForKey , modifier ) ;
				if ( ! modifiersForKey.length ) {
					delete this.wildChildrenModifierKeys[ details.parentPath ][ details.key ] ;
				}
			}
		}
	}
} ;



// Used for updates, when a ModifiersTable is changed (add one modifier)
StatsTable.prototype.addOneStatModifier = function( statName , modifier ) {
	//if ( ! this.checkModifiablePath( statName ) ) { return ; }
	let details = this.checkModifiablePath( statName , true ) ;
	if ( ! details ) { return ; }

	if ( ! this.statsModifiers[ statName ] ) { this.statsModifiers[ statName ] = [] ; }
	this.statsModifiers[ statName ].push( modifier ) ;
	this.statsModifiers[ statName ].sort( Modifier.sortFn ) ;

	if ( details.parent?.hasWildChildren ) {
		if ( ! this.wildChildrenModifierKeys[ details.parentPath ] ) { this.wildChildrenModifierKeys[ details.parentPath ] = {} ; }
		let modifiersForKey = this.wildChildrenModifierKeys[ details.parentPath ][ details.key ] ;
		if ( ! modifiersForKey ) { modifiersForKey = this.wildChildrenModifierKeys[ details.parentPath ][ details.key ] = [] ; }
		modifiersForKey.push( modifier ) ;
	}
} ;



StatsTable.prototype.checkModifiablePath = function( path , getDetails = false ) {
	if ( ! path ) { return false ; }
	var pathArray = path.split( '.' ) ;
	return this.nestedStats.checkModifiablePath( pathArray , getDetails , 0 ) ;
} ;



// Trigger an event
StatsTable.prototype.trigger = function( eventName ) {
	this.modifiersTables.forEach( modifiersTable => modifiersTable.trigger( eventName ) ) ;
} ;



StatsTable.prototype.cleanModifiersTables = function() {
	var modifiersTable , index = 0 ;

	while ( index < this.modifiersTables.length ) {
		modifiersTable = this.modifiersTables[ index ] ;

		if ( modifiersTable.destroyed ) {
			arrayKit.delete( this.modifiersTables , index ) ;
			this.afterUnstack( modifiersTable ) ;
		}
		else {
			index ++ ;
		}
	}
} ;



StatsTable.prototype.getModifiersTables = function() {
	this.cleanModifiersTables() ;
	return this.modifiersTables ;
} ;



StatsTable.prototype.getModifiersTablesProxy = function() {
	var modifiersTable ,
		object = {} ;

	this.cleanModifiersTables() ;

	for ( modifiersTable of this.modifiersTables ) {
		object[ modifiersTable.id ] = modifiersTable.getProxy() ;
	}

	return object ;
} ;



StatsTable.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , STATS_TABLE_HANDLER ) ;
	return this.proxy ;
} ;



const STATS_TABLE_PROXY_METHODS = new Set( [ 'setStat' , 'stack' , 'unstack' , 'trigger' ] ) ;

const STATS_TABLE_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return StatsTable ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return target.cloneProxy.bind( target ) ; }
		if ( property === 'extend' ) { return target.extendProxy.bind( target ) ; }

		if ( STATS_TABLE_PROXY_METHODS.has( property ) ) {
			return target[ property ].bind( target ) ;
		}

		if ( property === 'modifiersTables' || property === 'mods' ) {
			return target.getModifiersTablesProxy() ;
		}

		var proxy = target.nestedStats.getProxy() ;
		return proxy[ property ] ;
	} ,
	// Mostly a copy of .get()
	has: ( target , property , receiver ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return true ; }
		if ( property === 'constructor' ) { return true ; }
		if ( property === 'toString' ) { return true ; }
		if ( property === 'clone' ) { return true ; }
		if ( property === 'extend' ) { return true ; }

		if ( STATS_TABLE_PROXY_METHODS.has( property ) ) {
			return true ;
		}

		if ( property === 'modifiersTables' || property === 'mods' ) {
			return true ;
		}

		var proxy = target.nestedStats.getProxy() ;
		return proxy.has( property ) ;
	} ,
	set: ( target , property , value , receiver ) => {
		if ( STATS_TABLE_PROXY_METHODS.has( property ) ) { return false ; }

		var proxy = target.nestedStats.getProxy() ;
		proxy[ property ] = value ;		// If not possible, it would throw, so we can always return true here...
		return true ;
	} ,
	deleteProperty: () => false ,
	ownKeys: ( target ) => {
		var proxy = target.nestedStats.getProxy() ;
		return [ 'mods' , ... Object.keys( proxy ) ]
	} ,
	getOwnPropertyDescriptor: ( target , property ) => {
		// configurable:true is forced by Proxy Invariants
		if ( property === 'modifiersTables' || property === 'mods' || target.nestedStats.stats[ property ] ) {
			return { value: STATS_TABLE_HANDLER.get( target , property , target ) , enumerable: true , configurable: true } ;
		}
	} ,
	getPrototypeOf: ( target ) => Reflect.getPrototypeOf( target ) ,
	setPrototypeOf: () => false
} ;

