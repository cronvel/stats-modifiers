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
Pool.prototype.__prototypeUID__ = 'stats-modifiers/Pool' ;

module.exports = Pool ;



const common = require( './common.js' ) ;



Pool.prototype.operandType = 'number' ;

Pool.prototype.proxyMethods = {
	commit: 'commit' ,
	replenish: 'replenish' ,
	replenishReserve: 'replenishReserve' ,
	'replenish-reserve': 'replenishReserve' ,
	empty: 'empty' ,
	emptyReserve: 'emptyReserve' ,
	'empty-reserve': 'emptyReserve' ,
	cleanUp: 'cleanUp' ,
	'clean-up': 'cleanUp' ,
	add: 'add' ,
	preAdd: 'preAdd' ,
	'pre-add': 'preAdd' ,
	addToReserve: 'addToReserve' ,
	'add-to-reserve': 'addToReserve' ,
	gain: 'gain' ,
	preGain: 'preGain' ,
	'pre-gain': 'preGain' ,
	gainReserve: 'gainReserve' ,
	'gain-reserve': 'gainReserve' ,
	lose: 'lose' ,
	preLose: 'preLose' ,
	'pre-lose': 'preLose' ,
	loseReserve: 'loseReserve' ,
	'lose-reserve': 'loseReserve' ,
	restore: 'restore' ,
	preRestore: 'preRestore' ,
	'pre-restore': 'preRestore' ,
	restoreReserve: 'restoreReserve' ,
	'restore-reserve': 'restoreReserve' ,
	deplete: 'deplete' ,
	preDeplete: 'preDeplete' ,
	'pre-deplete': 'preDeplete' ,
	depleteReserve: 'depleteReserve' ,
	'deplete-reserve': 'depleteReserve' ,
	use: 'use' ,
	allocate: 'allocate' ,
	preUse: 'preUse' ,
	'pre-use': 'preUse' ,
	tap: 'tap' ,
	tapIntoReserve: 'tap' ,
	'tap-into-reserve': 'tap' ,
	stash: 'stash' ,
	stashInReserve: 'stash' ,
	'stash-in-reserve': 'stash' ,
	balance: 'balance' ,
	balanceReserve: 'balance' ,
	'balance-reserve': 'balance'
} ;

Pool.prototype.proxyEnumerableProperties = [
	'base' , 'actual' , 'used' , 'allocated' , 'reserve-factor' , 'reserve-used'
] ;

Pool.prototype.proxyProperties = {
	used: 'used' ,
	lost: 'used' ,
	reserveFactor: 'reserveFactor' ,
	'reserve-factor': 'reserveFactor' ,
	reserveUsed: 'reserveUsed' ,
	'reserve-used': 'reserveUsed' ,
	reserveLost: 'reserveUsed' ,
	'reserve-lost': 'reserveUsed' ,
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
	actualMax: 'getActualMax' ,
	'actual-max': 'getActualMax' ,
	actualReserve: 'getActualReserve' ,
	'actual-reserve': 'getActualReserve' ,
	actualPoolAndReserve: 'getActualPoolAndReserve' ,
	'actual-pool-and-reserve': 'getActualPoolAndReserve' ,
	actualReserveMax: 'getActualReserveMax' ,
	'actual-reserve-max': 'getActualReserveMax' ,
	isFull: 'isFull' ,
	'is-full': 'isFull' ,
	isReserveFull: 'isReserveFull' ,
	'is-reserve-full': 'isReserveFull' ,
	isEmpty: 'isEmpty' ,
	'is-empty': 'isEmpty' ,
	isReserveEmpty: 'isReserveEmpty' ,
	'is-reserve-empty': 'isReserveEmpty' ,
	overuse: 'getOveruse' ,
	overflow: 'getOverflow'
} ;

Pool.prototype.proxySetters = {
	actual: 'setActual' ,
	used: 'setUsed' ,
	lost: 'setUsed' ,
	actualReserve: 'setActualReserve' ,
	'actual-reserve': 'setActualReserve' ,
	reserveUsed: 'setReserveUsed' ,
	'reserve-used': 'setReserveUsed' ,
	reserveLost: 'setReserveUsed' ,
	'reserve-lost': 'setReserveUsed' ,
	reserveFactor: 'setReserveFactor' ,
	'reserve-factor': 'setReserveFactor' ,
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

		if ( params.reserveFactor !== undefined ) { this.setReserveFactor( params.reserveFactor ) ; }
		else if ( params['reserve-factor'] !== undefined ) { this.setReserveFactor( params['reserve-factor'] ) ; }

		if ( params.reserveUsed !== undefined ) { this.setReserveUsed( params.reserveUsed ) ; }
		else if ( params['reserve-used'] !== undefined ) { this.setReserveUsed( params['reserve-used'] ) ; }

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
		let max = Math.max( 0 , this.getActualMax() ) ;
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
		let max = Math.max( 0 , this.getActualMax() ) ;
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



Pool.prototype.setReserveFactor = function( factor ) {
	factor = + factor || 0 ;
	if ( factor < 0 ) { factor = 0 ; }
	this.reserveFactor = factor ;
	return true ;
} ;



Pool.prototype.setReserveUsed = function( used ) {
	used = + used || 0 ;
	if ( used < 0 ) { used = 0 ; }
	this.reserveUsed = used ;
	return true ;
} ;



Pool.prototype.getActual = function( pathKey = this.pathKey ) {
	var max = this.getActualMax() ,
		actual = max - this.used ;

	return this._postProcessActual( actual , max ) ;
} ;



Pool.prototype.setActual = function( actual ) {
	actual = + actual || 0 ;
	var max = this.getActualMax() ;

	// This is debatable if it is better to apply rounding or not for this method...
	// If so it should comes BEFORE anything else.
	if ( this.actualRound ) { actual = this._round( actual , this.actualRound ) ; }

	if ( ! this.actualOveruse && actual < 0 ) { actual = 0 ; }

	// .actualOverflow, has a greater importance than .actualOveruse
	if ( ! this.actualOverflow && actual > max ) { actual = max ; }

	this.used = max - actual ;

	if ( ! this.internalOveruse && this.used > max ) { this.used = max ; }

	// .internalOverflow, has a greater importance than .internalOveruse
	if ( ! this.internalOverflow && this.used < 0 ) { this.used = 0 ; }

	return true ;
} ;



// Return the sum of the reserve and the main pool, i.e. actual + actualReserve.
// Note: result can differs due to .actualRound, since here rounding occurs only once at the end (as well as overuse/overflow).
Pool.prototype.getActualPoolAndReserve = function() {
	var max = this.getActualMax() ,
		actual = max - this.used ,
		reserveMax = this.reserveFactor * max ,
		actualReserve = reserveMax - this.reserveUsed ;

	return this._postProcessActual( actual + actualReserve , max + reserveMax ) ;
} ;



Pool.prototype.getActualReserve = function() {
	var max = this.getActualReserveMax() ,
		actual = max - this.reserveUsed ;

	return this._postProcessActual( actual , max ) ;
} ;



Pool.prototype.setActualReserve = function( actual ) {
	actual = + actual || 0 ;
	var max = this.getActualReserveMax() ;

	// This is debatable if it is better to apply rounding or not for this method...
	// If so it should comes BEFORE anything else.
	if ( this.actualRound ) { actual = this._round( actual , this.actualRound ) ; }

	if ( ! this.actualOveruse && actual < 0 ) { actual = 0 ; }

	// .actualOverflow, has a greater importance than .actualOveruse
	if ( ! this.actualOverflow && actual > max ) { actual = max ; }

	this.reserveUsed = max - actual ;

	if ( ! this.internalOveruse && this.reserveUsed > max ) { this.reserveUsed = max ; }

	// .internalOverflow, has a greater importance than .internalOveruse
	if ( ! this.internalOverflow && this.reserveUsed < 0 ) { this.reserveUsed = 0 ; }

	return true ;
} ;



Pool.prototype.getActualMax = function() {
	return this.computeModifiers( this.base , this.base , this.pathKey ) ;
} ;



Pool.prototype.getActualReserveMax = function() {
	if ( ! this.reserveFactor ) { return 0 ; }
	return this.reserveFactor * this.getActualMax() ;
} ;



Pool.prototype.isFull = function() { return this.used <= 0 ; } ;
Pool.prototype.isReserveFull = function() { return this.reserveUsed <= 0 ; } ;
Pool.prototype.isEmpty = function() { return this.getActual() <= 0 ; } ;
Pool.prototype.isReserveEmpty = function() { return this.getActualReserve() <= 0 ; } ;



// Remove overusage or overflow, for both the main pool and the reserve.
// Does not take into consideration the allocated points.
Pool.prototype.cleanUp = function() {
	var max = this.getActualMax() ,
		reserveMax = this.reserveFactor * max ;

	// Order matters
	if ( this.used > max ) { this.used = max ; }
	if ( this.used < 0 ) { this.used = 0 ; }

	if ( this.reserveUsed > reserveMax ) { this.reserveUsed = reserveMax ; }
	if ( this.reserveUsed < 0 ) { this.reserveUsed = 0 ; }
} ;



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

Pool.prototype.replenishReserve = function() {
	if ( this.reserveUsed <= 0 ) { return 0 ; }
	var restored = this.reserveUsed ;
	this.reserveUsed = 0 ;
	return restored ;
} ;



// Empty the pool and return the removed quantity
Pool.prototype.empty = function() {
	var max = this.getActualMax() ,
		emptied = max - this.used - this.allocated ;
	if ( emptied <= 0 ) { return 0 ; }
	this.used += emptied ;
	return emptied ;
} ;

Pool.prototype.emptyReserve = function() {
	var max = this.getActualReserveMax() ,
		emptied = max - this.reserveUsed ;
	if ( emptied <= 0 ) { return 0 ; }
	this.reserveUsed += emptied ;
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

Pool.prototype.addToReserve = function( value ) {
	value = + value || 0 ;
	if ( value > 0 ) { return this._gainReserve( value ) ; }
	if ( value < 0 ) { return - this._loseReserve( - value ) ; }
	return 0 ;
} ;

// Gain a (positive) quantity and return the quantity actually gained.
Pool.prototype.gain = function( value ) { return this._gain( value ) ; } ;
Pool.prototype.preGain = function( value ) { return this._preGain( value ) ; } ;
Pool.prototype.gainReserve = function( value ) { return this._gainReserve( value ) ; } ;

// Lose a (positive) quantity and return the quantity actually lost.
Pool.prototype.lose = function( value ) { return this._lose( value ) ; } ;
Pool.prototype.preLose = function( value ) { return this._preLose( value ) ; } ;
Pool.prototype.loseReserve = function( value ) { return this._loseReserve( value ) ; } ;

// Restore/gain a (positive) quantity but never overflow, and return the quantity actually restored/gained
Pool.prototype.restore = function( value ) { return this._gain( value , false ) ; } ;
Pool.prototype.preRestore = function( value ) { return this._preGain( value , false ) ; } ;
Pool.prototype.restoreReserve = function( value ) { return this._gainReserve( value , false ) ; } ;

// Restore/gain a (positive) quantity but never overflow, and return the quantity actually restored/gained
Pool.prototype.deplete = function( value ) { return this._lose( value , false ) ; } ;
Pool.prototype.preDeplete = function( value ) { return this._preLose( value , false ) ; } ;
Pool.prototype.depleteReserve = function( value ) { return this._loseReserve( value , false ) ; } ;

// Use a (positive) quantity but never overuse, it will fail if the quantity is not available.
// Return false if it's not possible to spend that many points, or true if possible and had lost exactly that quantity.
Pool.prototype.use = function( value ) {
	var lost = this._lose( value , false , true ) ;
	return lost === value ;
} ;

// Allocate a (positive) quantity but never overuse, it will fail if the quantity is not available.
// Return false if it's not possible to spend that many points, or true if possible and had lost exactly that quantity.
Pool.prototype.allocate =
Pool.prototype.preUse = function( value ) {
	var lost = this._preLose( value , false , true ) ;
	return lost === value ;
} ;

// Tap into the reserve for a (positive) quantity but never overuse the reserve or overflow the main quantity, if so it would fail.
// Return true if succeeded or false otherwise.
Pool.prototype.tapIntoReserve =
Pool.prototype.tap = function( value ) {
	if ( ! value ) { return true ; }

	var oldReserveUsed = this.reserveUsed ;

	var lost = this._loseReserve( value , false , true ) ;
	if ( ! lost ) { return false ; }

	var gained = this._gain( lost , false , true ) ;
	if ( ! gained ) {
		// That value can't be gained, so we cancel the reserve lost...
		this.reserveUsed = oldReserveUsed ;
		return false ;
	}

	return true ;
} ;

// Stash in the reserve a (positive) quantity but never overflow the reserve or overuse the main quantity, if so it would fail.
// Return true if succeeded or false otherwise.
Pool.prototype.stashInReserve =
Pool.prototype.stash = function( value ) {
	if ( ! value ) { return true ; }

	var oldUsed = this.used ;

	var lost = this._lost( lost , false , true ) ;
	if ( ! lost ) { return false ; }

	var gained = this._gainReserve( value , false , true ) ;
	if ( ! gained ) {
		// That value can't be gained, so we cancel the main pool lost...
		this.used = oldUsed ;
		return false ;
	}

	return true ;
} ;

/*
	Restore the balance between the reserve with the main quantity.
	If reserveFactor=1 it makes it so both actual=actualReserve.
	For other value, the balance is using the relative weight between reserve and main.
	It returns the balance applied to the main quantity, thus can be positive, negative or 0.
	If it's not possible to balance due to any factor (allocation, overuse, overflow), nothing is done and it returns 0.
*/
Pool.prototype.reserveBalance =
Pool.prototype.balance = function() {
	if ( ! this.reserveFactor ) { return 0 ; }

	var max = this.getActualMax() ,
		actual = max - this.used ,
		reserveMax = this.reserveFactor * max ,
		actualReserve = reserveMax - this.reserveUsed ,
		sum = actual + actualReserve ,
		wantedActual = sum / ( 1 + this.reserveFactor ) ;

	if ( this.actualRound ) { wantedActual = this._round( wantedActual , this.actualRound ) ; }

	var balance = wantedActual - actual ;

	if ( balance > 0 ) {
		return this.tap( balance ) ? balance : 0 ;
	}

	if ( balance < 0 ) {
		return this.stash( - balance ) ? balance : 0 ;
	}

	return 0 ;
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

	value: the value to gain, must be positive
	overflow: force an overflow mode instead of using the defined behavior
	onlyIfExact: if set, it does nothing if the pool can't gain that exact value
*/
Pool.prototype._gainReserve = function( value , overflow = this.internalOverflow , onlyIfExact = false ) {
	value = + value || 0 ;
	if ( value <= 0 ) { return 0 ; }

	var reserveUsed = this.reserveUsed ;

	if ( overflow ) {
		reserveUsed -= value ;
	}
	else {
		if ( this.reserveUsed <= 0 ) { return 0 ; }	// Avoid truncating it when using ._gainReserve()

		reserveUsed -= value ;
		if ( reserveUsed < 0 ) { reserveUsed = 0 ; }
	}

	var actualValue = this.reserveUsed - reserveUsed ;

	if ( onlyIfExact && actualValue !== value ) { return 0 ; }

	this.reserveUsed = reserveUsed ;
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
		let max = Math.max( 0 , this.getActualMax() ) ;
		if ( this.used >= max || this.used + this.allocated >= max ) { return 0 ; }	// Avoid truncating it when using ._lose()

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
		let max = Math.max( 0 , this.getActualMax() ) ;
		if ( this.used + this.allocated >= max ) { return 0 ; }	// Avoid truncating it when using ._preLose()

		allocated += value ;
		if ( allocated + this.used > max ) { allocated = max - this.used ; }
	}

	var actualValue = allocated - this.allocated ;

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
Pool.prototype._loseReserve = function( value , overuse = this.internalOveruse , onlyIfExact = false ) {
	value = + value || 0 ;
	if ( value <= 0 ) { return 0 ; }

	var reserveUsed = this.reserveUsed ;

	if ( overuse ) {
		reserveUsed += value ;
	}
	else {
		let max = Math.max( 0 , this.getActualReserveMax() ) ;
		if ( this.reserveUsed >= max ) { return 0 ; }	// Avoid truncating it when using ._loseReserve()

		reserveUsed += value ;
		if ( reserveUsed > max ) { reserveUsed = max ; }
	}

	var actualValue = reserveUsed - this.reserveUsed ;

	if ( onlyIfExact && actualValue !== value ) { return 0 ; }

	this.reserveUsed = reserveUsed ;
	return actualValue ;
} ;



// Internal.
// Apply actualOveruse/actualOverflow/actualRounding to an actual value (used by .getActual(), .getActualReserve(), etc...)
Pool.prototype._postProcessActual = function( actual , max ) {
	if ( ! this.actualOveruse && actual < 0 ) { actual = 0 ; }

	// .actualOverflow, has a greater importance than .actualOveruse
	if ( ! this.actualOverflow && actual > max ) { actual = max ; }

	// This should come last
	if ( this.actualRound ) { actual = this._round( actual , this.actualRound ) ; }

	return actual ;
} ;



// Add or substract before Math.round(), .ceil() or .floor()
const ROUND_EPSILON = 0.000000001 ;	// 10e-9

Pool.prototype._round = function( value , type ) {
	switch ( type ) {
		case 'round' :
			// For .round() we add epsilon to preserve the halve-up behavior
			return Math.round( value + ROUND_EPSILON ) ;
		case 'floor' :
			return Math.floor( value + ROUND_EPSILON ) ;
		case 'ceil' :
			return Math.ceil( value - ROUND_EPSILON ) ;
		default :
			return value ;
	}
} ;

