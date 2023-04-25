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

const arrayKit = require( 'array-kit' ) ;



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

	this.balance = 0 ;
}

Gauge.prototype = Object.create( Stat.prototype ) ;
Gauge.prototype.constructor = Gauge ;

module.exports = Gauge ;



Gauge.prototype.proxyMethods = {
	use: 'use' ,
	remove: 'remove'
} ;

Gauge.prototype.proxyProperties = {
	min: 'min' ,
	max: 'max'
} ;

Gauge.prototype.proxyWritableProperties = {
	min: 'min' ,
	max: 'max'
} ;

Gauge.prototype.proxyGetters = {
	balance: 'getBalance' ,
	used: 'getUsed'
} ;

Gauge.prototype.proxySetters = {
	balance: 'setBalance' ,
	used: 'setUsed'
} ;



Gauge.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new Gauge( this , parentTable , pathKey ) ;
} ;



Gauge.prototype.getActual = function( pathKey = this.pathKey ) {
	var base = this.getBase() ,
		actual = base + this.balance ;

	actual = this.computeModifiers( actual , base , pathKey ) ;
	actual = Math.max( this.min , Math.min( this.max , actual ) ) ;
	return actual ;
} ;



Gauge.prototype.getBalance = function() { return this.balance ; } ;
Gauge.prototype.getUsed = function() { return - this.balance ; } ;



// Return false if it's not possible to use that many point
Gauge.prototype.remove = function( value ) {
	value = + value || 0 ;
	if ( value < 0 ) { return 0 ; }

	var actual = this.getActual() ,
		actualAfter = actual + this.balance - value ;

	if ( actualAfter < this.min ) {
		value -= this.min - actualAfter ;
		if ( value < 0 ) { return 0 ; }
	}

	this.balance -= value ;

	return value ;
} ;



// Return false if it's not possible to use that many points
Gauge.prototype.use = function( value ) {
	value = + value || 0 ;
	if ( value < 0 ) { return false ; }

	var base = this.getBase() ;

	if ( base + this.balance - value < this.min ) { return false ; }
	this.balance -= value ;
	
	return true ;
} ;

