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
	this.negative = false ;	// allow actual value to be negative (not capped at 0)
	this.overflow = false ;	// allow actual value to exceed base value ("used" can be negative)
	this.round = null ;	// null, "round", "ceil" or "floor"

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
	negative: 'negative' ,
	overflow: 'overflow' ,
	round: 'round'
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
	negative: 'setNegative' ,
	overflow: 'setOverflow' ,
	round: 'setRound'
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
		// Order matters! .used should be set AFTER .overflow
		if ( params.base !== undefined ) { this.setBase( params.base ) ; }
		if ( params.overflow !== undefined ) { this.setOverflow( params.overflow ) ; }
		if ( params.used !== undefined ) { this.setUsed( params.used ) ; }
		if ( params.negative !== undefined ) { this.setNegative( params.negative ) ; }
		if ( params.round !== undefined ) { this.setRound( params.round ) ; }
		return true ;
	}

	return false ;
} ;



Pool.prototype.setBase = function( base ) {
	this.base = + base || 0 ;
	return true ;
} ;



Pool.prototype.setUsed = function( used ) {
	used = + used || 0 ;
	this.used = this.overflow ? used : Math.max( 0 , used ) ;
	return true ;
} ;



Pool.prototype.setNegative = function( negative ) {
	this.negative = !! negative ;
	return true ;
} ;



Pool.prototype.setOverflow = function( overflow ) {
	this.overflow = !! overflow ;
	if ( ! this.overflow && this.used < 0 ) { this.used = 0 ; }
	return true ;
} ;



Pool.prototype.setRound = function( round ) {
	this.round = ! round ? null :
		round === 'ceil' ? 'ceil' :
		round === 'floor' ? 'floor' :
		'round' ;
	return true ;
} ;



Pool.prototype.getActual = function( pathKey = this.pathKey ) {
	var actual = this.computeModifiers( this.base , this.base , pathKey ) ;
	actual -= this.used ;
	if ( actual < 0 && ! this.negative ) { actual = 0 ; }

	if ( this.round ) {
		actual = Math[ this.round ]( actual ) ;
	}

	return actual ;
} ;



Pool.prototype.setActual = function( actual ) {
	actual = + actual || 0 ;
	this.used = this.getMax() - actual ;
	if ( this.used < 0 && ! this.overflow ) { this.used = 0 ; }
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

