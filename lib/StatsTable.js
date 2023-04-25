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



const Stat = require( './Stat.js' ) ;
const Modifier = require( './Modifier.js' ) ;
const ModifiersTable = require( './ModifiersTable.js' ) ;

const common = require( './common.js' ) ;

const arrayKit = require( 'array-kit' ) ;



function StatsTable( stats = null , clone = false ) {
	this.stats = {} ;
	this.modifiersTables = [] ;	// list of modifiersTable of the StatsTable
	this.statsModifiers = {} ;	// per stat modifier list (key is a key's full path)
	this.proxy = null ;
	this.proxyToMeta = new Map() ;	// Store meta (path, isWild) for each nested proxies (used for wild card)
	this.pathToProxy = {} ;	// Key: path, value: proxy

	if ( stats ) { this.setStats( stats , clone ) ; }
}

module.exports = StatsTable ;



StatsTable.prototype.setStats = function( stats , clone = false ) {
	for ( let statName in stats ) { this.setStat( statName , stats[ statName ] , undefined , clone ) ; }
} ;



StatsTable.prototype.setStat = function( statName , params , pointer = this.stats , pathKey = null , clone = false ) {
	pathKey = pathKey ? pathKey + '.' + statName : statName ;

	if ( params === null ) {
		delete pointer[ statName ] ;
	}
	else if ( common.isPlainObjectOrArray( params ) && params.__prototypeUID__ !== 'kung-fig/Operator' && params.__prototypeUID__ !== 'kung-fig/Expression' && params.__prototypeUID__ !== 'kung-fig/Ref' ) {
		// Nested stats
		if (
			pointer[ statName ] && (
				( pointer[ statName ] instanceof Stat ) ||
				Array.isArray( params ) !== Array.isArray( pointer[ statName ] )
			)
		) {
			// Uncompatible: drop it (or error?)
			return ;
		}

		if ( Array.isArray( params ) ) {
			if ( ! pointer[ statName ] ) {
				pointer[ statName ] = [] ;
				pointer[ statName ][ common.SYMBOL_PARENT ] = this ;
			}
			else {
				pointer[ statName ].length = 0 ;	// erase the array, it doesn't make sense to set some index...
			}

			params.forEach( ( element , index ) => this.setStat( index , element , pointer[ statName ] , pathKey , clone ) ) ;
		}
		else {
			if ( ! pointer[ statName ] ) {
				pointer[ statName ] = {} ;
				pointer[ statName ][ common.SYMBOL_PARENT ] = this ;
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
	}
	else {
		if ( pointer[ statName ] ) {
			if ( pointer[ statName ] instanceof Stat ) { pointer[ statName ].set( params ) ; }
			else { return ; }	// drop?
		}
		else {
			pointer[ statName ] = Stat.create( this , pathKey , params , clone ) ;
		}
	}
} ;



StatsTable.prototype.clone = function() {
	var statsTable = new StatsTable() ;
	statsTable.destClone_( this.stats , statsTable.stats ) ;
	return statsTable ;
} ;

StatsTable.prototype.cloneProxy = function() { return this.clone().getProxy() ; } ;



StatsTable.prototype.destClone_ = function( source , dest ) {
	var key ,
		keys = Array.isArray( source ) ? source.keys() : Object.keys( source ) ;

	for ( key of keys ) {
		if ( source[ key ] instanceof Stat ) {
			dest[ key ] = source[ key ].clone( this ) ;
		}
		else {
			if ( Array.isArray( source[ key ] ) ) { dest[ key ] = [] ; }
			else { dest[ key ] = {} ; }

			dest[ key ][ common.SYMBOL_PARENT ] = this ;
			this.destClone_( source[ key ] , dest[ key ] ) ;
		}
	}
} ;



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
		if ( ! this.checkPath( statName ) ) { continue ; }

		for ( op in modifiersTable.statsModifiers[ statName ] ) {
			modifier = modifiersTable.statsModifiers[ statName ][ op ] ;
			if ( ! this.statsModifiers[ statName ] ) { this.statsModifiers[ statName ] = [] ; }
			this.statsModifiers[ statName ].push( modifier ) ;
		}

		if ( this.statsModifiers[ statName ] && this.statsModifiers[ statName ].length ) {
			this.statsModifiers[ statName ].sort( Modifier.sortFn ) ;
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
		if ( ! this.checkPath( statName ) ) { continue ; }

		for ( op in modifiersTable.statsModifiers[ statName ] ) {
			modifier = modifiersTable.statsModifiers[ statName ][ op ] ;
			arrayKit.deleteValue( this.statsModifiers[ statName ] , modifier ) ;
		}
	}
} ;



// Used for updates, when a ModifiersTable is changed (add one modifier)
StatsTable.prototype.addOneStatModifier = function( statName , modifier ) {
	if ( ! this.checkPath( statName ) ) { return ; }
	if ( ! this.statsModifiers[ statName ] ) { this.statsModifiers[ statName ] = [] ; }
	this.statsModifiers[ statName ].push( modifier ) ;
	this.statsModifiers[ statName ].sort( Modifier.sortFn ) ;
} ;



// Check if a stat path is correct: it points to a Stat or to an intermediate object with wildcard support
StatsTable.prototype.checkPath = function( path ) {
	var node , pathPart ,
		pathArray = path.split( '.' ) ,
		pointer = this.stats ;

	for ( pathPart of pathArray ) {
		node = pointer[ pathPart ] ;
		if ( ! node ) {
			if ( pointer['*'] ) {
				node = pointer['*'] ;
			}
			else {
				return false ;
			}
		}
		pointer = node ;
	}

	return ( node instanceof Stat ) || node['*'] !== undefined ;
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
	get: ( statsTable , property , receiver ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return statsTable ; }
		if ( property === 'constructor' ) { return StatsTable ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return statsTable.cloneProxy.bind( statsTable ) ; }
		if ( property === 'extend' ) { return statsTable.extendProxy.bind( statsTable ) ; }

		if ( STATS_TABLE_PROXY_METHODS.has( property ) ) {
			//return Reflect.get( statsTable , property , receiver ) ;	// Don't work, not bounded
			return statsTable[ property ].bind( statsTable ) ;
		}

		if ( property === 'modifiersTables' || property === 'mods' ) {
			return statsTable.getModifiersTablesProxy() ;
		}

		var targetProxy ,
			target = statsTable.stats ,
			targetValue = target[ property ] ,
			targetValuePath = property ;

		if ( targetValue && typeof targetValue === 'object' ) {
			targetProxy = statsTable.pathToProxy[ targetValuePath ] ;
			if ( targetProxy ) { return targetProxy ; }

			//targetValue[ common.SYMBOL_PARENT ] = statsTable ;

			targetProxy = new Proxy(
				targetValue ,
				targetValue instanceof Stat ? Stat.STAT_HANDLER : INTERMEDIATE_STATS_TABLE_HANDLER
			) ;

			statsTable.pathToProxy[ targetValuePath ] = targetProxy ;
			statsTable.proxyToMeta.set( targetProxy , {
				path: targetValuePath ,
				isWild: false
			} ) ;

			return targetProxy ;
		}

		return ;
	} ,
	set: ( target , property , value , receiver ) => {
		if ( STATS_TABLE_PROXY_METHODS.has( property ) ) { return false ; }

		if ( target.stats[ property ] ) {
			target.stats[ property ].set( value ) ;
			return true ;
		}

		return false ;
	} ,

	ownKeys: ( target ) => [ 'mods' , ... Object.keys( target.stats ) ] ,
	getOwnPropertyDescriptor: ( target , property ) => {
		// configurable:true is forced by Proxy Invariants
		if ( property === 'modifiersTables' || property === 'mods' || target.stats[ property ] ) {
			return { value: STATS_TABLE_HANDLER.get( target , property , target ) , configurable: true } ;
		}
	}
} ;



function getWildKeys( statsTable , target , path , onlyBase ) {
	var keys = Object.keys( target ) ,
		base = new Set( keys ) ;

	base.delete( '*' ) ;

	if ( onlyBase ) { return base ; }

	return Stat.computeModifiers( new Set( base ) , base , statsTable.statsModifiers[ path ] ) ;
}



// Proxy for the .statsModifiers[ key ] objects
const INTERMEDIATE_STATS_TABLE_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return Object ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }

		var targetProxy ,
			isWild = false ,
			statsTable = target[ common.SYMBOL_PARENT ] ,
			receiverMeta = statsTable.proxyToMeta.get( receiver ) ;

		if ( property === 'base' && target['*'] ) { return getWildKeys( statsTable , target , receiverMeta.path , true ) ; }
		if ( property === 'actual' && target['*'] ) { return getWildKeys( statsTable , target , receiverMeta.path ) ; }

		var targetValue = target[ property ] ,
			targetValuePath = receiverMeta.path + '.' + property ;
		//console.log( "intermediate stat get:" , receiverMeta.path , !! target['*'] ) ;

		if ( targetValue === undefined && target['*'] ) {
			let wildKeys = getWildKeys( statsTable , target , receiverMeta.path ) ;
			//console.log( "intermediate stat A" , wildKeys ) ;

			// If it doesn't have any modifiers that added that key, exit now!
			if ( ! wildKeys.has( property ) ) { return ; }

			// Change the target for the wildCard
			targetValue = target['*'] ;
			isWild = true ;
		}

		if ( targetValue && typeof targetValue === 'object' ) {
			//console.log( "intermediate stat B" ) ;
			targetProxy = statsTable.pathToProxy[ targetValuePath ] ;
			if ( targetProxy ) { return targetProxy ; }

			if ( targetValue instanceof Stat ) {
				targetProxy = new Proxy( targetValue , Stat.STAT_HANDLER ) ;
			}
			else {
				//targetValue[ common.SYMBOL_PARENT ] = statsTable ;
				targetProxy = new Proxy( targetValue , INTERMEDIATE_STATS_TABLE_HANDLER ) ;
			}

			statsTable.pathToProxy[ targetValuePath ] = targetProxy ;
			statsTable.proxyToMeta.set( targetProxy , {
				path: targetValuePath ,
				isWild: receiverMeta.isWild || isWild
			} ) ;

			return targetProxy ;
		}

		return Reflect.get( target , property , receiver ) ;
	}
	//set: ( target , property , value , receiver ) => {}
} ;

