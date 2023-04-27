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
const common = require( './common.js' ) ;



/*
	A Gauge is used for gauge system like hit points, action points, and generaly things that can be used, depleted, restored,
	replenished on a new turn, and so on...
*/

function Gauge( params = {} , parentTable = null , pathKey = null ) {
	Stat.call( this , + params.base || 0 , parentTable , pathKey ) ;

	this.min = + params.min || 0 ;
	this.max =
		params.max !== undefined ? + params.max || 0 :
		this.base >= 0 ? this.base :
		Infinity ;

	this.balance = + params.balance || 0 ;

	// Balance overflow: allow the balance to overflow min and max, so that when a modifier buff or debuff the value,
	// the remainder may be used to adjust
	this.overflow = !! params.overflow ;
}

Gauge.prototype = Object.create( Stat.prototype ) ;
Gauge.prototype.constructor = Gauge ;

module.exports = Gauge ;



Gauge.prototype.operandType = 'number' ;

Gauge.prototype.proxyMethods = {
	restore: 'restore' ,
	replenish: 'replenish' ,
	empty: 'empty' ,
	add: 'add' ,
	gain: 'gain' ,
	refill: 'refill' ,
	lose: 'lose' ,
	spend: 'spend'
} ;

Gauge.prototype.proxyProperties = {
	min: 'min' ,
	max: 'max' ,
	balance: 'balance'
} ;

Gauge.prototype.proxyWritableProperties = {
	min: 'min' ,
	max: 'max' ,
	balance: 'balance'
} ;

Gauge.prototype.proxyGetters = {
	isFull: 'isFull' ,
	'is-full': 'isFull' ,
	isEmpty: 'isEmpty' ,
	'is-empty': 'isEmpty' ,
	gained: 'getGained' ,
	spent: 'getSpent' ,
	lost: 'getSpent' ,
	actualMin: 'getActualMin' ,
	'actual-min': 'getActualMin' ,
	actualMax: 'getActualMax' ,
	'actual-max': 'getActualMax'
} ;

Gauge.prototype.proxySetters = {
	gained: 'setGained' ,
	spent: 'setSpent' ,
	lost: 'setSpent'
} ;

Gauge.prototype.innerMods = new Set( [ 'min' , 'max' ] ) ;



Gauge.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new Gauge( this , parentTable , pathKey ) ;
} ;



Gauge.prototype.getActualMin = function( pathKey = this.pathKey ) {
	return this.computeModifiers( this.min , this.min , pathKey + '.min' ) ;
} ;



Gauge.prototype.getActualMax = function( pathKey = this.pathKey ) {
	return this.computeModifiers( this.max , this.max , pathKey + '.max' ) ;
} ;



// Passing min and max can be used for optimization when they are already computed from the caller, or for passing custom values...
Gauge.prototype.getActual = function( pathKey = this.pathKey , min = null , max = null ) {
	var base = this.getBase() ;

	min = min ?? this.getActualMin() ;
	max = max ?? this.getActualMax() ;

	var actual = this.computeModifiers( base , base , pathKey ) ;
	actual += this.balance ;
	actual = Math.max( min , Math.min( max , actual ) ) ;
	return actual ;
} ;



Gauge.prototype.isFull = function() { return this.getActual() >= this.getActualMax() ; } ;
Gauge.prototype.isEmpty = function() { return this.getActual() <= this.getActualMin() ; } ;

Gauge.prototype.getGained = function() { return Math.max( 0 , this.balance ) ; } ;
Gauge.prototype.setGained = function( gained ) {
	if ( gained >= 0 ) { this.balance = gained ; }
} ;

Gauge.prototype.getSpent = function() { return Math.max( 0 , - this.balance ) ; } ;
Gauge.prototype.setSpent = function( spent ) {
	if ( spent >= 0 ) { this.balance = - spent ; }
} ;



// Restore the gauge to its base value, if no modifiers are applied (it set its balance to 0)
Gauge.prototype.restore = function() {
	var value = - this.balance ;
	this.balance = 0 ;
	return value ;
} ;



// Fully replenish the gauge and return the gained quantity
Gauge.prototype.replenish = function() {
	var max = this.getActualMax() ,
		actual = this.getActual( undefined , undefined , max ) ;

	if ( actual > max ) { return 0 ; }
	var value = max - actual ;
	this.balance += value ;
	return value ;
} ;



// Empty the gauge and return the removed quantity
Gauge.prototype.empty = function() {
	var min = this.getActualMin() ,
		actual = this.getActual( undefined , min ) ;

	if ( actual < min ) { return 0 ; }
	var value = actual - min ;
	this.balance -= value ;
	return value ;
} ;



/*
	Return the value actually added.
	The behavior changes if "overflow" is on: if so it always adds the value.
*/
Gauge.prototype.add = function( value ) {
	value = + value || 0 ;
	return value >= 0 ? this.gain( value ) : - this.lose( - value ) ;
} ;



/*
	Return the value actually gained.
	The behavior changes if "overflow" is on: if so it always adds the value.
*/
Gauge.prototype.gain = function( value ) {
	value = + value || 0 ;
	if ( value < 0 ) { return 0 ; }

	var max = this.getActualMax() ,
		actual = this.getActual( undefined , undefined , max ) ;

	if ( ! this.overflow ) {
		let actualAfter = actual + value ;

		if ( actualAfter > max ) {
			value = max - actual ;
			if ( value < 0 ) { return 0 ; }
		}
	}

	this.balance += value ;

	return value ;
} ;



// Return false if it's not possible to refill that many points
Gauge.prototype.refill = function( value ) {
	value = + value || 0 ;
	if ( value < 0 ) { return false ; }

	var max = this.getActualMax() ,
		actual = this.getActual( undefined , undefined , max ) ;

	if ( actual + value > max ) { return false ; }
	this.balance += value ;

	return true ;
} ;



/*
	Return the value actually lost.
	The behavior changes if "overflow" is on: if so it always removes the value.
*/
Gauge.prototype.lose = function( value ) {
	value = + value || 0 ;
	if ( value < 0 ) { return 0 ; }

	var min = this.getActualMin() ,
		actual = this.getActual( undefined , min ) ;

	if ( ! this.overflow ) {
		let actualAfter = actual - value ;

		if ( actualAfter < min ) {
			value = actual - min ;
			if ( value < 0 ) { return 0 ; }
		}
	}

	this.balance -= value ;

	return value ;
} ;



// Return false if it's not possible to spend that many points
Gauge.prototype.spend = function( value ) {
	value = + value || 0 ;
	if ( value < 0 ) { return false ; }

	var min = this.getActualMin() ,
		actual = this.getActual( undefined , min ) ;

	if ( actual - value < min ) { return false ; }
	this.balance -= value ;

	return true ;
} ;

