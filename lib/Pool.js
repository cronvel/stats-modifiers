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



/*
	A Pool is used for pool system like hit points, action points, and generaly things that can be used, depleted, restored,
	replenished on a new turn, and so on...
*/

function Pool( params = {} , parentTable = null , pathKey = null ) {
	if ( typeof params === 'number' ) { params = { base: params , used: 0 } ; }
	Stat.call( this , 0 , parentTable , pathKey ) ;

	this.used = 0 ;	// this is the main value tracking changes

	// Modes
	this.overuse = false ;	// allow to use more than the remaining (.used can be > .max), producing .actual < 0 if .actualOveruse is set
	this.overflow = false ;	// allow .used to be negative, producing .actual > .max if .actualOverflow is set
	this.actualOveruse = false ;	// allow .actual value to be negative
	this.actualOverflow = false ;	// allow .actual value to be negative (not capped at 0)
	this.actualRound = null ;	// round .actual (not .used), can be: null, "round", "ceil" or "floor"

	if ( params ) { this.set( params ) ; }
}

const Stat = require( './Stat.js' ) ;
Pool.prototype = Object.create( Stat.prototype ) ;
Pool.prototype.constructor = Pool ;

module.exports = Pool ;



const common = require( './common.js' ) ;



Pool.prototype.operandType = 'number' ;

Pool.prototype.proxyMethods = {
	replenish: 'replenish' ,
	empty: 'empty' ,
	add: 'add' ,
	restore: 'restore' ,
	lose: 'lose' ,
	use: 'use'
} ;

Pool.prototype.proxyProperties = {
	used: 'used' ,
	lost: 'used' ,
	overuse: 'overuse' ,
	overflow: 'overflow' ,
	actualOveruse: 'actualOveruse' ,
	'actual-overuse': 'actualOveruse' ,
	actualOverflow: 'actualOverflow' ,
	'actual-overflow': 'actualOverflow' ,
	actualRound: 'actualRound' ,
	'actual-round': 'actualRound'
} ;

Pool.prototype.proxyWritableProperties = {} ;

Pool.prototype.proxyGetters = {
	max: 'getMax' ,
	isFull: 'isFull' ,
	'is-full': 'isFull' ,
	isEmpty: 'isEmpty' ,
	'is-empty': 'isEmpty'
} ;

Pool.prototype.proxySetters = {
	actual: 'setActual' ,
	used: 'setUsed' ,
	lost: 'setUsed' ,
	overuse: 'setOveruse' ,
	overflow: 'setOverflow' ,
	actualOveruse: 'setActualOveruse' ,
	'actual-overuse': 'setActualOveruse' ,
	actualOverflow: 'setActualOverflow' ,
	'actual-overflow': 'setActualOverflow' ,
	actualRound: 'setActualRound' ,
	'actual-round': 'setActualRound'
} ;



Pool.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new Pool( this , parentTable , pathKey ) ;
} ;



// Called by Spellcast when extending a data structure
Pool.prototype.set = function( params ) {
	if ( typeof params === 'number' ) {
		this.setBase( params ) ;
		return true ;
	}

	if ( common.isPlainObject( params ) || params instanceof Pool ) {
		// The order matters! .used should be set AFTER .overflow
		if ( params.base !== undefined ) { this.setBase( params.base ) ; }

		if ( params.overuse !== undefined ) { this.setOveruse( params.overuse ) ; }
		if ( params.overflow !== undefined ) { this.setOverflow( params.overflow ) ; }
		if ( params.used !== undefined ) { this.setUsed( params.used ) ; }

		if ( params.actualOveruse !== undefined ) { this.setActualOveruse( params.actualOveruse ) ; }
		else if ( params['actual-overuse'] !== undefined ) { this.setActualOveruse( params['actual-overuse'] ) ; }

		if ( params.actualOverflow !== undefined ) { this.setActualOverflow( params.actualOverflow ) ; }
		else if ( params['actual-overflow'] !== undefined ) { this.setActualOverflow( params['actual-overflow'] ) ; }

		if ( params.actualRound !== undefined ) { this.setActualRound( params.actualRound ) ; }
		else if ( params['actual-round'] !== undefined ) { this.setActualRound( params['actual-round'] ) ; }

		return true ;
	}

	return false ;
} ;



Pool.prototype.setBase = function( base ) {
	this.base = + base || 0 ;
	return true ;
} ;



Pool.prototype.setUsed = function( used ) {
	this.used = + used || 0 ;

	if ( ! this.overuse ) {
		let max = this.getMax() ;
		if ( this.used > max ) { this.used = max ; }
	}

	// .overflow, has a greater importance than .overuse
	if ( ! this.overflow && this.used < 0 ) { this.used = 0 ; }

	return true ;
} ;



Pool.prototype.setOveruse = function( overuse ) {
	this.overuse = !! overuse ;

	if ( ! this.overuse ) {
		let max = this.getMax() ;
		if ( this.used > max ) {
			this.used = max ;
			// Since .used changed, check for .overflow, which has a greater importance than .overuse
			if ( ! this.overflow && this.used < 0 ) { this.used = 0 ; }
		}
	}

	return true ;
} ;



Pool.prototype.setOverflow = function( overflow ) {
	this.overflow = !! overflow ;
	if ( ! this.overflow && this.used < 0 ) { this.used = 0 ; }
	return true ;
} ;



Pool.prototype.setActualOveruse = function( overuse ) {
	this.actualOveruse = !! overuse ;
	return true ;
} ;



Pool.prototype.setActualOverflow = function( overflow ) {
	this.actualOverflow = !! overflow ;
	return true ;
} ;



Pool.prototype.setActualRound = function( round ) {
	this.actualRound = ! round ? null :
		round === 'ceil' ? 'ceil' :
		round === 'floor' ? 'floor' :
		'round' ;
	return true ;
} ;



Pool.prototype.getActual = function( pathKey = this.pathKey ) {
	var max = this.getMax() ,
		actual = max - this.used ;

	if ( ! this.actualOveruse && actual < 0 ) { actual = 0 ; }

	// .actualOverflow, has a greater importance than .actualOveruse
	if ( ! this.actualOverflow && actual > max ) { actual = max ; }

	// This should come last
	if ( this.actualRound ) { actual = Math[ this.actualRound ]( actual ) ; }

	return actual ;
} ;



Pool.prototype.setActual = function( actual ) {
	actual = + actual || 0 ;
	var max = this.getMax() ;
	this.used = max - actual ;
	if ( this.used < 0 && ! this.overflow ) { this.used = 0 ; }

// ----------------------------- HERE ---------------------------------------------

	// /!\ We should check .actualRound FIRST !

	if ( ! this.overuse && this.used > max ) { this.used = max ; }

	// .overflow, has a greater importance than .overuse
	if ( ! this.overflow && this.used < 0 ) { this.used = 0 ; }

} ;



Pool.prototype.getMax = function() {
	return this.computeModifiers( this.base , this.base , this.pathKey ) ;
} ;



Pool.prototype.isFull = function() { return this.used <= 0 ; } ;
Pool.prototype.isEmpty = function() { return this.getActual() <= 0 ; } ;



// Restore the pool to its max
Pool.prototype.replenish = function() {
	if ( this.used <= 0 ) { return 0 ; }
	var restored = this.used ;
	this.used = 0 ;
	return restored ;
} ;



// Empty the pool and return the removed quantity
Pool.prototype.empty = function() {
	var max = this.getMax() ,
		emptied = max - this.used ;
	if ( emptied <= 0 ) { return 0 ; }
	this.used = max ;
	return emptied ;
} ;



//	Return the value actually added
Pool.prototype.add = function( value ) {
	value = + value || 0 ;

	var used = this.used - value ;
	if ( used < 0 && ! this.overflow ) { used = 0 ; }

	var delta = this.used - used ;
	this.used = used ;

	return delta ;
} ;



// Return the value actually restored
Pool.prototype.restore = function( value ) {
	value = + value || 0 ;
	if ( value <= 0 ) { return 0 ; }

	var used = this.used - value ;
	if ( used < 0 && ! this.overflow ) { used = 0 ; }

	var delta = this.used - used ;
	this.used = used ;

	return delta ;
} ;



// Return the value actually lost
Pool.prototype.lose = function( value ) {
	value = + value || 0 ;
	if ( value <= 0 ) { return 0 ; }
	this.used += value ;
	return value ;
} ;



// Return false if it's not possible to spend that many points, else return true
Pool.prototype.use = function( value ) {
	value = + value || 0 ;
	if ( value < 0 || this.used + value > this.getMax() ) { return false ; }
	this.used += value ;
	return true ;
} ;

