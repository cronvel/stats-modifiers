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



const operators = require( './operators.js' ) ;
const arrayKit = require( 'array-kit' ) ;



const lib = {} ;
module.exports = lib ;



function StatsTable( stats = null ) {
	this.stats = {} ;
	this.modifiersTables = [] ;
	this.upToDate = false ;
	this.proxy = null ;

	if ( stats ) {
		for ( let statName in stats ) { this.setStat( statName , stats[ statName ] ) ; }
	}
}

lib.StatsTable = StatsTable ;



StatsTable.prototype.setStat = function( statName , params ) {
	if ( this.stats[ statName ] ) { this.stats[ statName ].set( params ) ; }
	else { this.stats[ statName ] = new Stat( params ) ; }
} ;



StatsTable.prototype.stack = function( modifiersTable ) {
	var statName , subName , op , stat , modifier ;

	if ( ! ( modifiersTable instanceof ModifiersTable ) ) { throw new Error( 'Not a ModifiersTable' ) ; }
	this.modifiersTables.push( modifiersTable ) ;

	for ( statName in modifiersTable.statsModifiers ) {
		for ( subName in modifiersTable.statsModifiers[ statName ] ) {
			stat = this.stats[ statName ] ;
			if ( ! stat ) { continue ; }

			if ( subName ) {
				stat = stat.sub[ subName ] ;
				if ( ! stat ) { continue ; }
			}

			for ( op in modifiersTable.statsModifiers[ statName ][ subName ] ) {
				modifier = modifiersTable.statsModifiers[ statName ][ subName ][ op ] ;
				stat.modifiers.push( modifier ) ;
			}

			stat.modifiers.sort( Modifier.sortFn ) ;
			stat.update() ;
		}
	}
} ;



StatsTable.prototype.unstack = function( modifiersTable ) {
	var index , statName , subName , op , stat , modifier ;

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

	for ( statName in modifiersTable.statsModifiers ) {
		for ( subName in modifiersTable.statsModifiers[ statName ] ) {
			stat = this.stats[ statName ] ;
			if ( ! stat ) { continue ; }

			if ( subName ) {
				stat = stat.sub[ subName ] ;
				if ( ! stat ) { continue ; }
			}

			for ( op in modifiersTable.statsModifiers[ statName ][ subName ] ) {
				modifier = modifiersTable.statsModifiers[ statName ][ subName ][ op ] ;
				arrayKit.delete( stat.modifiers , modifier ) ;
			}

			stat.update() ;
		}
	}
} ;



const STATS_TABLE_PROXY_METHODS = new Set( [ 'setStat' ] ) ;

const STATS_TABLE_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( STATS_TABLE_PROXY_METHODS.has( property ) ) {
			return Reflect.get( target , property , receiver ) ;
		}

		if ( target.stats[ property ] ) {
			return target.stats[ property ].getProxy() ;
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
	}
} ;



StatsTable.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , STATS_TABLE_HANDLER ) ;
	return this.proxy ;
} ;



function Stat( params ) {
	if ( ! params || typeof params !== 'object' ) { params = { base: params } ; }

	this.base = params.base ;
	this.actual = this.base ;
	this.sub = {} ;	// sub-stats, like regen, and so on
	this.modifiers = [] ;
	this.constraints = null ;	// TODO
	this.proxy = null ;

	for ( let subName in params ) {
		if ( subName === 'base' || subName === 'actual' ) { continue ; }
		this.setSubStat( subName , params[ subName ] ) ;
	}
}

lib.Stat = Stat ;



Stat.prototype.set = function( params ) {
	var updateNeeded = false ;

	if ( ! params || typeof params !== 'object' ) {
		this.base = params ;
		updateNeeded = true ;
	}
	else {
		for ( let subName in params ) {
			if ( subName === 'actual' ) { continue ; }

			if ( subName === 'base' ) {
				this.base = params[ subName ] ;
				updateNeeded = true ;
			}
			else if ( this.sub[ subName ] ) {
				this.sub[ subName ].set( params[ subName ] ) ;
			}
			else {
				this.setSubStat( subName , params[ subName ] ) ;
			}
		}
	}

	if ( updateNeeded ) { this.update() ; }
} ;



Stat.prototype.setSubStat = function( subName , params ) {
	if ( this.sub[ subName ] ) { return ; }
	this.sub[ subName ] = new Stat( params ) ;
} ;



Stat.prototype.update = function() {
	this.actual = this.base ;

	// It should be already sorted, since it's sorted on insertion
	for ( let modifier of this.modifiers ) {
		this.actual = modifier.apply( this.actual ) ;
	}
} ;



const STAT_PROXY_METHODS = new Set( [] ) ;
const STAT_PROXY_LOCAL = new Set( [ 'base' , 'actual' ] ) ;

const STAT_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( STAT_PROXY_METHODS.has( property ) || STAT_PROXY_LOCAL.has( property ) ) {
			return Reflect.get( target , property , receiver ) ;
		}

		if ( target.sub[ property ] ) {
			return target.sub[ property ].getProxy() ;
		}

		return ;
	}
} ;



Stat.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , STAT_HANDLER ) ;
	return this.proxy ;
} ;



function ModifiersTable( id , statsModifiers = null ) {
	this.id = id ;
	this.statsModifiers = {} ;	// per-stat modifier
	this.proxy = null ;

	if ( statsModifiers ) {
		for ( let statName in statsModifiers ) { this.setStatModifier( statName , statsModifiers[ statName ] ) ; }
	}
}

lib.ModifiersTable = ModifiersTable ;



ModifiersTable.prototype.setStatModifier = function( statName , modifiers ) {
	var operator , operand , priority , canonicalOperator , ops , subName , key , sortNeeded = false ;

	if ( ! Array.isArray( modifiers[ 0 ] ) ) { modifiers = [ modifiers ] ; }

	[ statName , subName ] = statName.split( '.' ) ;

	if ( ! subName ) { subName = '' ; }
	if ( ! this.statsModifiers[ statName ] ) { this.statsModifiers[ statName ] = {} ; }
	if ( ! this.statsModifiers[ statName ][ subName ] ) { this.statsModifiers[ statName ][ subName ] = {} ; }

	ops = this.statsModifiers[ statName ][ subName ] ;

	for ( [ operator , operand , priority ] of modifiers ) {
		if ( ! operators[ operator ] ) { throw new Error( "Unknown operator '" + operator + "'" ) ; }

		key = canonicalOperator = operators[ operator ].id ;
		if ( priority ) { key += priority ; }

		if ( ops[ key ] ) {
			ops[ key ].merge( operand ) ;
		}
		else {
			ops[ key ] = new Modifier( this.id , canonicalOperator , operand , priority ) ;
		}
	}
} ;



const MODIFIERS_TABLE_PROXY_METHODS = new Set( [ 'setStatModifier' ] ) ;

const MODIFIERS_TABLE_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( MODIFIERS_TABLE_PROXY_METHODS.has( property ) ) {
			return Reflect.get( target , property , receiver ) ;
		}

		if ( target.statsModifiers[ property ] ) {
			return target.statsModifiers[ property ] ;	//.getProxy() ;
		}

		return ;
	}
} ;



ModifiersTable.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , MODIFIERS_TABLE_HANDLER ) ;
	return this.proxy ;
} ;



function Modifier( id , operator , operand , priority = 0 ) {
	if ( ! operators[ operator ] ) { throw new Error( "Unknown operator '" + operator + "'" ) ; }

	this.id = id ;
	this.fn = operators[ operator ] ;	// operator function
	this.operator = this.fn.id ;	// operator identifier
	this.operand = operand ;
	this.priority = priority ;
}

lib.Modifier = Modifier ;



Modifier.sortFn = ( a , b ) => b.fn.priority - a.fn.priority || b.priority - a.priority ;



Modifier.prototype.merge = function( operand ) {
	this.operand = this.fn.merge( this.operand , operand ) ;
} ;



Modifier.prototype.apply = function( existingValue ) {
	return this.fn( existingValue , this.operand ) ;
} ;

