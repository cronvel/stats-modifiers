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
	Stat.call( this , + params.base || 0 , parentTable , pathKey ) ;
	this.used = + params.used || 0 ;
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
	lost: 'used'
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
	lost: 'setUsed'
} ;



Pool.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new Pool( this , parentTable , pathKey ) ;
} ;



Pool.prototype.getActual = function( pathKey = this.pathKey ) {
	var actual = this.computeModifiers( this.base , this.base , pathKey ) ;
	actual -= this.used ;
	actual = Math.max( 0 , actual ) ;
	return actual ;
} ;



Pool.prototype.setActual = function( actual ) {
	actual = + actual || 0 ;
	var max = this.getMax() ;
	this.used = Math.max( 0 , max - actual ) ;
} ;



Pool.prototype.getMax = function() {
	return this.computeModifiers( this.base , this.base , this.pathKey ) ;
} ;



Pool.prototype.setUsed = function( used ) {
	used = + used || 0 ;
	this.used = Math.max( 0 , used ) ;
} ;



Pool.prototype.isFull = function() { return this.used === 0 ; } ;
Pool.prototype.isEmpty = function() { return this.getActual() === 0 ; } ;



// Restore the pool to its max
Pool.prototype.replenish = function() {
	var restored = this.used ;
	this.used = 0 ;
	return restored ;
} ;



// Empty the pool and return the removed quantity
Pool.prototype.empty = function() {
	var max = this.getMax() ,
		emptied = max - this.used ;
	this.used = max ;
	return emptied ;
} ;



//	Return the value actually added
Pool.prototype.add = function( value ) {
	value = + value || 0 ;
	var oldUsed = this.used ;
	this.used = Math.max( 0 , this.used - value ) ;
	return oldUsed - this.used ;
} ;



// Return the value actually restored
Pool.prototype.restore = function( value ) {
	value = + value || 0 ;
	if ( value < 0 ) { return 0 ; }
	var oldUsed = this.used ;
	this.used = Math.max( 0 , this.used - value ) ;
	return oldUsed - this.used ;
} ;



// Return the value actually lost
Pool.prototype.lose = function( value ) {
	value = + value || 0 ;
	if ( value < 0 ) { return 0 ; }
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

