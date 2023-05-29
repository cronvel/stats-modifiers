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



// Add or substract before Math.round(), .ceil() or .floor()
const ROUND_EPSILON = 0.000000001 ;	// 10e-9



/*
	A Pool is used for pool system like hit points, action points, and generaly things that can be used, depleted, restored,
	replenished on a new turn, and so on...
*/

function Pool( params = {} , parentTable = null , pathKey = null ) {
	if ( typeof params === 'number' ) { params = { base: params , used: 0 } ; }
	Stat.call( this , 0 , parentTable , pathKey ) ;

	this.used = 0 ;		// the quantity used and wasted, this is the main value affecting .actual, aside from modifiers
	this.allocated = 0 ;	// prepare to use this quantity, but do not commit it yet, does not change .actual until commited

	this.reserveFactor = 0 ;	// if set, the pool has a secondary reserve, which can be used to restore the main pool
	this.reserveUsed = 0 ;	// the quantity of the reserve that have been used, to refill the main pool

	/*
		Modes and default behavior:
		We want .internalOveruse to be on by default because it is CONSISTENT.
		It is possible to .stack() modifiers and .use() some of the pool's quantity in any order, then .unstack()
		and get consistent results.
	*/
	this.internalOveruse = true ;	// allow to use more than the remaining (.used can be > .max), producing .actual < 0 if .actualOveruse is set
	this.internalOverflow = false ;	// allow .used to be negative, producing .actual > .max if .actualOverflow is set
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
	commit: 'commit' ,
	replenish: 'replenish' ,
	empty: 'empty' ,
	add: 'add' ,
	preAdd: 'preAdd' ,
	'pre-add': 'preAdd' ,
	gain: 'gain' ,
	preGain: 'preGain' ,
	'pre-gain': 'preGain' ,
	lose: 'lose' ,
	preLose: 'preLose' ,
	'pre-lose': 'preLose' ,
	restore: 'restore' ,
	preRestore: 'preRestore' ,
	'pre-restore': 'preRestore' ,
	deplete: 'deplete' ,
	preDeplete: 'preDeplete' ,
	'pre-deplete': 'preDeplete' ,
	use: 'use' ,
	allocate: 'allocate' ,
	preUse: 'preUse' ,
	'pre-use': 'preUse'
} ;

Pool.prototype.proxyProperties = {
	used: 'used' ,
	lost: 'used' ,
	allocated: 'allocated' ,
	internalOveruse: 'internalOveruse' ,
	'internal-overuse': 'internalOveruse' ,
	internalOverflow: 'internalOverflow' ,
	'internal-overflow': 'internalOverflow' ,
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
	'is-empty': 'isEmpty' ,
	overuse: 'getOveruse' ,
	overflow: 'getOverflow'
} ;

Pool.prototype.proxySetters = {
	actual: 'setActual' ,
	used: 'setUsed' ,
	lost: 'setUsed' ,
	internalOveruse: 'setInternalOveruse' ,
	'internal-overuse': 'setInternalOveruse' ,
	internalOverflow: 'setInternalOverflow' ,
	'internal-overflow': 'setInternalOverflow' ,
	actualOveruse: 'setActualOveruse' ,
	'actual-overuse': 'setActualOveruse' ,
	actualOverflow: 'setActualOverflow' ,
	'actual-overflow': 'setActualOverflow' ,
	overuse: 'setOveruse' ,
	overflow: 'setOverflow' ,
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
		// The order matters! .used should be set AFTER .internalOverflow and .internalOveruse
		if ( params.base !== undefined ) { this.setBase( params.base ) ; }

		if ( params.overuse !== undefined ) { this.setOveruse( params.overuse ) ; }
		if ( params.overflow !== undefined ) { this.setOverflow( params.overflow ) ; }

		if ( params.internalOveruse !== undefined ) { this.setInternalOveruse( params.internalOveruse ) ; }
		else if ( params['internal-overuse'] !== undefined ) { this.setInternalOveruse( params['internal-overuse'] ) ; }

		if ( params.internalOverflow !== undefined ) { this.setInternalOverflow( params.internalOverflow ) ; }
		else if ( params['internal-overflow'] !== undefined ) { this.setInternalOverflow( params['internal-overflow'] ) ; }

		if ( params.actualOveruse !== undefined ) { this.setActualOveruse( params.actualOveruse ) ; }
		else if ( params['actual-overuse'] !== undefined ) { this.setActualOveruse( params['actual-overuse'] ) ; }

		if ( params.actualOverflow !== undefined ) { this.setActualOverflow( params.actualOverflow ) ; }
		else if ( params['actual-overflow'] !== undefined ) { this.setActualOverflow( params['actual-overflow'] ) ; }

		if ( params.actualRound !== undefined ) { this.setActualRound( params.actualRound ) ; }
		else if ( params['actual-round'] !== undefined ) { this.setActualRound( params['actual-round'] ) ; }

		if ( params.used !== undefined ) { this.setUsed( params.used ) ; }
		if ( params.allocated !== undefined ) { this.setAllocated( params.allocated ) ; }

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

	if ( ! this.internalOveruse ) {
		let max = Math.max( 0 , this.getMax() ) ;
		let maxMinusAllocated = this.allocated > 0 ? max - this.allocated : max ;
		if ( this.used > maxMinusAllocated ) { this.used = maxMinusAllocated ; }
	}

	// .internalOverflow, has a greater importance than .internalOveruse
	if ( ! this.internalOverflow && this.used < 0 ) { this.used = 0 ; }

	return true ;
} ;



Pool.prototype.setAllocated = function( allocated ) {
	this.allocated = + allocated || 0 ;

	if ( ! this.internalOveruse ) {
		let max = Math.max( 0 , this.getMax() ) ;
		let maxMinusUsed = this.used > 0 ? max - this.used : max ;
		if ( this.allocated > maxMinusUsed ) { this.allocated = maxMinusUsed ; }
	}

	// .internalOverflow, has a greater importance than .internalOveruse
	if ( ! this.internalOverflow && this.allocated < 0 ) { this.allocated = 0 ; }

	return true ;
} ;



Pool.prototype.getOveruse = function() { return this.internalOveruse && this.actualOveruse ; } ;
Pool.prototype.getOverflow = function() { return this.internalOverflow && this.actualOverflow ; } ;
Pool.prototype.setOveruse = function( overuse ) { this.setInternalOveruse( overuse ) ; this.setActualOveruse( overuse ) ; return true ; } ;
Pool.prototype.setOverflow = function( overflow ) { this.setInternalOverflow( overflow ) ; this.setActualOverflow( overflow ) ; return true ; } ;



Pool.prototype.setInternalOveruse = function( overuse ) {
	overuse = !! overuse ;
	if ( this.internalOveruse === overuse ) { return true ; }
	this.internalOveruse = overuse ;

	if ( ! this.internalOveruse ) {
		// It's safer to re-use the same process.
		// If it's overused, allocated will be truncated first.
		this.setAllocated( this.allocated ) ;
		this.setUsed( this.used ) ;
	}

	return true ;
} ;



Pool.prototype.setInternalOverflow = function( overflow ) {
	overflow = !! overflow ;
	if ( this.internalOverflow === overflow ) { return true ; }
	this.internalOverflow = overflow ;

	if ( ! this.internalOverflow ) {
		if ( this.used < 0 ) { this.used = 0 ; }
		if ( this.allocated < 0 ) { this.allocated = 0 ; }
	}

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
	if ( this.actualRound ) {
		switch ( this.actualRound ) {
			case 'round' :
				// For .round() we add epsilon to preserve the halve-up behavior
				actual = Math.round( actual + ROUND_EPSILON ) ;
				break ;
			case 'floor' :
				actual = Math.floor( actual + ROUND_EPSILON ) ;
				break ;
			case 'ceil' :
				actual = Math.ceil( actual - ROUND_EPSILON ) ;
				break ;
		}
	}

	return actual ;
} ;



Pool.prototype.setActual = function( actual ) {
	actual = + actual || 0 ;
	var max = this.getMax() ;

	// This is debatable if it is better to apply rounding or not for this method...
	// If so it should comes BEFORE anything else.
	if ( this.actualRound ) {
		switch ( this.actualRound ) {
			case 'round' :
				// For .round() we add epsilon to preserve the halve-up behavior
				actual = Math.round( actual + ROUND_EPSILON ) ;
				break ;
			case 'floor' :
				actual = Math.floor( actual + ROUND_EPSILON ) ;
				break ;
			case 'ceil' :
				actual = Math.ceil( actual - ROUND_EPSILON ) ;
				break ;
		}
	}

	if ( ! this.actualOveruse && actual < 0 ) { actual = 0 ; }

	// .actualOverflow, has a greater importance than .actualOveruse
	if ( ! this.actualOverflow && actual > max ) { actual = max ; }

	this.used = max - actual ;

	if ( ! this.internalOveruse && this.used > max ) { this.used = max ; }

	// .internalOverflow, has a greater importance than .internalOveruse
	if ( ! this.internalOverflow && this.used < 0 ) { this.used = 0 ; }

	return true ;
} ;



Pool.prototype.getMax = function() {
	return this.computeModifiers( this.base , this.base , this.pathKey ) ;
} ;



Pool.prototype.isFull = function() { return this.used <= 0 ; } ;
Pool.prototype.isEmpty = function() { return this.getActual() <= 0 ; } ;



// Commit the pre-allocated quantity, there are now considered used
Pool.prototype.commit = function() {
	this.used += this.allocated ;
	this.allocated = 0 ;
} ;



// Restore the pool to its max and return the gained quantity
Pool.prototype.replenish = function() {
	if ( this.used <= 0 ) { return 0 ; }
	var restored = this.used ;
	this.used = 0 ;
	return restored ;
} ;



// Empty the pool and return the removed quantity
Pool.prototype.empty = function() {
	var max = this.getMax() ,
		emptied = max - this.used - this.allocated ;
	if ( emptied <= 0 ) { return 0 ; }
	this.used += emptied ;
	return emptied ;
} ;



// Add a relative (positive or negative) quantity and return the quantity actually added
Pool.prototype.add = function( value ) {
	value = + value || 0 ;
	if ( value > 0 ) { return this._gain( value ) ; }
	if ( value < 0 ) { return - this._lose( - value ) ; }
	return 0 ;
} ;

Pool.prototype.preAdd = function( value ) {
	value = + value || 0 ;
	if ( value > 0 ) { return this._preGain( value ) ; }
	if ( value < 0 ) { return - this._preLose( - value ) ; }
	return 0 ;
} ;

// Gain a (positive) quantity and return the quantity actually gained.
Pool.prototype.gain = function( value ) { return this._gain( value ) ; }
Pool.prototype.preGain = function( value ) { return this._preGain( value ) ; }

// Lose a (positive) quantity and return the quantity actually lost.
Pool.prototype.lose = function( value ) { return this._lose( value ) ; }
Pool.prototype.preLose = function( value ) { return this._preLose( value ) ; }

// Restore/gain a (positive) quantity but never overflow, and return the quantity actually restored/gained
Pool.prototype.restore = function( value ) { return this._gain( value , false ) ; }
Pool.prototype.preRestore = function( value ) { return this._preGain( value , false ) ; }

// Restore/gain a (positive) quantity but never overflow, and return the quantity actually restored/gained
Pool.prototype.deplete = function( value ) { return this._lose( value , false ) ; }
Pool.prototype.preDeplete = function( value ) { return this._preLose( value , false ) ; }

// Use a (positive) quantity but never overuse, it will fail if the quantity is not available.
// Return false if it's not possible to spend that many points, or true if possible and had lost exactly that quantity.
Pool.prototype.use = function( value ) {
	var lost = this._lose( value , false , true ) ;
	return lost === value ;
} ;

Pool.prototype.allocate =
Pool.prototype.preUse = function( value ) {
	var lost = this._preLose( value , false , true ) ;
	return lost === value ;
} ;



/*
	Internal.

	value: the value to gain, must be positive
	overflow: force an overflow mode instead of using the defined behavior
	onlyIfExact: if set, it does nothing if the pool can't gain that exact value
*/
Pool.prototype._gain = function( value , overflow = this.internalOverflow , onlyIfExact = false ) {
	value = + value || 0 ;
	if ( value <= 0 ) { return 0 ; }

	var used = this.used ;
	
	if ( overflow ) {
		used -= value ;
	}
	else {
		// Got double constraint on both actual used value and to-be-commited value
		if ( this.used <= 0 || this.used + this.allocated <= 0 ) { return 0 ; }	// Avoid truncating it when using ._gain()

		used -= value ;
		if ( used + this.allocated < 0 ) { used = - this.allocated ; }
		if ( used < 0 ) { used = 0 ; }
	}

	var actualValue = this.used - used ;

	if ( onlyIfExact && actualValue !== value ) { return 0 ; }

	this.used = used ;
	return actualValue ;
} ;



/*
	Internal.

	value: the value to gain, must be positive
	overflow: force an overflow mode instead of using the defined behavior
	onlyIfExact: if set, it does nothing if the pool can't gain that exact value
*/
Pool.prototype._preGain = function( value , overflow = this.internalOverflow , onlyIfExact = false ) {
	value = + value || 0 ;
	if ( value <= 0 ) { return 0 ; }

	var allocated = this.allocated ;
	
	if ( overflow ) {
		allocated -= value ;
	}
	else {
		if ( this.used + this.allocated <= 0 ) { return 0 ; }	// Avoid truncating it when using ._preGain()

		allocated -= value ;
		if ( allocated + this.used < 0 ) { allocated = - this.used ; }
	}

	var actualValue = this.allocated - allocated ;

	if ( onlyIfExact && actualValue !== value ) { return 0 ; }

	this.allocated = allocated ;
	return actualValue ;
} ;



/*
	Internal.

	value: the value to lose, must be positive
	overuse: force an overuse mode instead of using the defined behavior
	onlyIfExact: if set, it does nothing if the pool can't lose that exact value
*/
Pool.prototype._lose = function( value , overuse = this.internalOveruse , onlyIfExact = false ) {
	value = + value || 0 ;
	if ( value <= 0 ) { return 0 ; }

	var used = this.used ;

	if ( overuse ) {
		used += value ;
	}
	else {
		// Got double constraint on both actual used value and to-be-commited value
		let max = Math.max( 0 , this.getMax() ) ;
		if ( this.used >= max || this.used + this.allocated >= max ) { return 0 ; }	// Avoid truncating it when using .lose()

		used += value ;
		if ( used + this.allocated > max ) { used = max - this.allocated ; }
		if ( used > max ) { used = max ; }
	}

	var actualValue = used - this.used ;

	if ( onlyIfExact && actualValue !== value ) { return 0 ; }

	this.used = used ;
	return actualValue ;
} ;



/*
	Internal.

	value: the value to lose, must be positive
	overuse: force an overuse mode instead of using the defined behavior
	onlyIfExact: if set, it does nothing if the pool can't lose that exact value
*/
Pool.prototype._preLose = function( value , overuse = this.internalOveruse , onlyIfExact = false ) {
	value = + value || 0 ;
	if ( value <= 0 ) { return 0 ; }

	var allocated = this.allocated ;

	if ( overuse ) {
		allocated += value ;
	}
	else {
		let max = Math.max( 0 , this.getMax() ) ;
		if ( this.used + this.allocated >= max ) { return 0 ; }	// Avoid truncating it when using ._preLose()

		allocated += value ;
		if ( allocated + this.used > max ) { allocated = max - this.used ; }
	}

	var actualValue = allocated - this.allocated ;

	if ( onlyIfExact && actualValue !== value ) { return 0 ; }

	this.allocated = allocated ;
	return actualValue ;
} ;

