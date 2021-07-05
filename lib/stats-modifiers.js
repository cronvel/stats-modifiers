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



const lib = {} ;
module.exports = lib ;



function StatsTable( stats = null ) {
	this.stats = {} ;
	this.modifiersTables = [] ;
	this.upToDate = false ;
	this.proxy = null ;
	
	if ( stats ) {
		for ( let statName in stats ) { this.addStat( statName , stats[ statName ] ) ; }
	}
}

lib.StatsTable = StatsTable ;



StatsTable.prototype.addStat = function( statName , base ) {
	if ( ! this.stats[ statName ] ) {
		this.stats[ statName ] = new Stat( base ) ;
	}
	else {
		this.stats[ statName ].base = base ;
	}
} ;



StatsTable.prototype.stack = function( modifiersTable ) {
	if ( ! ( modifiersTable instanceof ModifiersTable ) ) { throw new Error( 'Not a ModifiersTable') ; }
	this.modifiersTables.push( modifiersTable ) ;
	this.update() ;
} ;



StatsTable.prototype.update = function() {
} ;



const STATS_TABLE_PROXY_METHODS = new Set( [ 'addStat' ] ) ;

const STATS_TABLE_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( STATS_TABLE_PROXY_METHODS.has( property ) ) {
			return Reflect.get( target , property , receiver ) ;
		}

		if ( target.stats[ property ] ) {
			return target.stats[ property ].getProxy() ;
		}
		
		return ;
	}
} ;



StatsTable.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , STATS_TABLE_HANDLER ) ;
	return this.proxy ;
} ;



function Stat( base ) {
	this.base = base ;
	this.actual = this.base ;
	this.sub = {} ;	// sub-stats, like regen, and so on
	this.modifiers = [] ;
	this.constraints = null ;	// TODO
	this.proxy = null ;
}

lib.Stat = Stat ;



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



const MODIFIERS_TABLE_PROXY_METHODS = new Set( [ 'addStatModifier' ] ) ;

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



function ModifiersTable( id , statsModifiers = null ) {
	this.id = id ;
	this.statsModifiers = {} ;	// per-stat modifier
	this.proxy = null ;

	if ( statsModifiers ) {
		for ( let statName in statsModifiers ) { this.addStatModifier( statName , statsModifiers[ statName ] ) ; }
	}
}

lib.ModifiersTable = ModifiersTable ;



ModifiersTable.prototype.addStatModifier = function( statName , modifiers ) {
	var index , operator , operand ,
		sortNeeded = false ,
		stack = this.statsModifiers[ statName ] ;

	if ( ! stack ) { stack = this.statsModifiers[ statName ] = [] ; }
	
	for ( [ operator , operand ] of modifiers ) {
		index = stack.findIndex( e => e.operator === operator ) ;
		
		if ( index === -1 ) {
			stack.push( new Modifier( this.id , operator , operand ) ) ;
			sortNeeded = true ;
		}
		else {
			stack[ index ].merge( operand ) ;
		}
	}

	if ( sortNeeded ) {
		// Sort from higher priority to lower
		stack.sort( ( a , b ) => b - a ) ;
	}
} ;



function Modifier( id , operator , operand ) {
	this.id = id ;
	this.operator = operator ;	// operator identifier
	this.operand = operand ;
	this.fn = null ;	// operator function
	this.priority = this.fn?.priority || 0 ;
}

lib.Modifier = Modifier ;



Modifier.prototype.merge = function( operand ) {
	// TMP:
	this.operand += operand ;
} ;



