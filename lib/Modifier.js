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



function Modifier( id , operator , operand , priorityGroup = null , active = true ) {
	if ( ! operators[ operator ] ) { throw new Error( "Unknown operator '" + operator + "'" ) ; }

	if ( operators[ operator ].convert ) {
		operand = operators[ operator ]( operand ) ;
		operator = operators[ operator ].convert ;
	}

	this.id = id ;
	this.fn = operators[ operator ] ;	// operator function
	this.operator = this.fn.id ;	// operator identifier
	this.operand = operand ;
	this.priorityGroup = priorityGroup === null ? this.fn.priorityGroup : priorityGroup ;
	this.active = !! active ;
	this.proxy = null ;
}

Modifier.prototype.__prototypeUID__ = 'stats-modifiers/Modifier' ;
Modifier.prototype.__prototypeVersion__ = require( '../package.json' ).version ;

module.exports = Modifier ;



const common = require( './common.js' ) ;
const operators = require( './operators.js' ) ;



Modifier.sortFn = ( a , b ) => b.priorityGroup - a.priorityGroup || b.fn.priority - a.fn.priority ;



Modifier.prototype.merge = function( operand ) {
	this.operand = this.fn.merge( this.operand , operand ) ;
} ;



Modifier.prototype.set =
Modifier.prototype.setOperand = function( operand ) {
	this.operand = operand ;
} ;



Modifier.prototype.apply = function( operandType , existingValue , base ) {
	if ( ! this.fn.anyType && operandType !== this.fn.type ) { return existingValue ; }
	return this.fn( existingValue , this.operand , base ) ;
} ;



Modifier.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , MODIFIER_HANDLER ) ;
	return this.proxy ;
} ;



const MODIFIER_PROXY_METHODS = new Set( [ 'merge' ] ) ;
const MODIFIER_PROXY_LOCAL = new Set( [ 'id' , 'operator' , 'operand' , 'priorityGroup' , 'active' ] ) ;

const MODIFIER_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === '__prototypeUID__' ) { return target.__prototypeUID__ ; }
		if ( property === '__prototypeVersion__' ) { return target.__prototypeVersion__ ; }
		if ( property === 'constructor' ) { return Modifier ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }

		if ( MODIFIER_PROXY_METHODS.has( property ) ) {
			//return Reflect.get( target , property , receiver ) ;	// Don't work, not bounded
			return target[ property ].bind( target ) ;
		}

		if ( MODIFIER_PROXY_LOCAL.has( property ) ) {
			return Reflect.get( target , property , receiver ) ;
		}

		return ;
	} ,
	// Mostly a copy of .get()
	has: ( target , property ) => {
		//if ( property === common.SYMBOL_UNPROXY ) { return true ; }
		//if ( property === '__prototypeUID__' ) { return target.__prototypeUID__ ; }
		//if ( property === '__prototypeVersion__' ) { return target.__prototypeVersion__ ; }
		if ( property === 'constructor' ) { return true ; }
		if ( property === 'toString' ) { return true ; }
		if ( MODIFIER_PROXY_METHODS.has( property ) ) { return true ; }
		if ( MODIFIER_PROXY_LOCAL.has( property ) ) { return true ; }
		return false ;
	} ,
	set: ( target , property , value ) => {
		if ( MODIFIER_PROXY_METHODS.has( property ) ) { return false ; }

		if ( property === 'operand' ) {
			target.setOperand( value ) ;
			return true ;
		}

		return false ;
	} ,
	deleteProperty: () => false ,
	ownKeys: () => [ ... MODIFIER_PROXY_LOCAL ] ,
	getOwnPropertyDescriptor: ( target , property ) => {
		// configurable:true is forced by Proxy Invariants
		if ( MODIFIER_PROXY_LOCAL.has( property ) ) {
			return { value: MODIFIER_HANDLER.get( target , property , target ) , configurable: true } ;
		}
	} ,
	getPrototypeOf: ( target ) => Reflect.getPrototypeOf( target ) ,
	setPrototypeOf: () => false
} ;

