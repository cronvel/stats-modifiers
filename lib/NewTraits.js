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
	Traits stats are a collection of traits, or tags.
	They can be useful to add/remove properties to/from an entity.
*/

function Traits( base , parentTable = null , pathKey = null ) {
	Stat.call( this , {} , parentTable , pathKey ) ;

	if ( base && typeof base === 'object' ) {
		this.setBase( base ) ;
	}

	this.baseProxy = null ;
	this.actualProxy = null ;
}

Traits.prototype = Object.create( Stat.prototype ) ;
Traits.prototype.constructor = Traits ;

module.exports = Traits ;



Traits.prototype.operandType = 'set' ;
Traits.prototype.hasCustomChildren = true ;

Traits.prototype.proxyMethods = {} ;
Traits.prototype.proxyProperties = {} ;
Traits.prototype.proxyWritableProperties = {} ;
Traits.prototype.proxyGetters = {} ;
Traits.prototype.proxySetters = {} ;



Traits.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new Traits( this.base , parentTable , pathKey ) ;
} ;



Traits.prototype.set =
Traits.prototype.setBase = function( base ) {
	if ( Array.isArray( base ) || base instanceof Set ) {
		common.clearObject( this.base ) ;
		for ( let trait of base ) {
			if ( trait && typeof trait === 'string' ) {
				this.base[ trait ] = true ;
			}
		}
	}
	else if ( common.isPlainObject( base ) ) {
		common.clearObject( this.base ) ;
		for ( let trait in base ) {
			if ( trait && typeof trait === 'string' && base[ trait ] ) {
				this.base[ trait ] = true ;
			}
		}
	}
	else if ( base && typeof base === 'string' ) {
		common.clearObject( this.base ) ;
		this.base[ base ] = true ;
	}
} ;

Traits.prototype.getBase =
Traits.prototype.getBaseProxy = function() {
	if ( this.baseProxy ) { return this.baseProxy ; }
	this.baseProxy = new Proxy( this.base , BASE_HANDLER ) ;
	return this.baseProxy ;
} ;



Traits.prototype.getActual = function( pathKey = this.pathKey ) {
	if ( this.actualProxy ) { return this.actualProxy ; }
	var actual = {} ;
	actual[ common.SYMBOL_PARENT ] = this ;
	this.actualProxy = new Proxy( actual , ACTUAL_HANDLER ) ;
	return this.actualProxy ;
} ;



Traits.prototype.clear = function() { common.clearObject( this.base ) ; } ;



const BASE_HANDLER = {
	get: ( target , property , receiver ) => {
		//if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( ! property || typeof property !== 'string' ) { return false ; }
		return target[ property ] === true ;
	} ,
	set: ( target , property , value , receiver ) => {
		if ( ! property || typeof property !== 'string' ) { return false ; }
		if ( value ) { target[ property ] = true ; }
		else { delete target[ property ] ; }
		return true ;
	} ,
	ownKeys: ( target ) => [ ... Object.keys( target ) ] ,
	getOwnPropertyDescriptor: ( target , property ) => {
		if ( ! property || typeof property !== 'string' ) { return ; }
		return {
			value: target[ property ] === true ,
			writable: true ,
			// Mandatory, for some reason .ownKeys() is always cross-checking each props using getOwnPropertyDescriptor().enumerable
			enumerable: true ,
			configurable: true
		} ;
	}
} ;

Traits.BASE_HANDLER = BASE_HANDLER ;



const ACTUAL_HANDLER = {
	get: ( target , property , receiver ) => {
		//if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( ! property || typeof property !== 'string' ) { return false ; }

		var parent = target[ common.SYMBOL_PARENT ] ,
			base = parent.base[ property ] === true ;

		return parent.computeModifiers( base , base , parent.pathKey + '.' + property ) ;
	} ,
	set: ( target , property , value , receiver ) => false ,
	ownKeys: ( target ) => {
		var parent = target[ common.SYMBOL_PARENT ] ,
			parentTable = parent[ common.SYMBOL_PARENT ] ,
			keys = new Set( Object.keys( parent.base ) ) ;
		
		for ( let property in parentTable.customChildrenModifierKeys[ parent.pathKey ] ) {
			if ( ! property || typeof property !== 'string' ) { continue ; }
			let base = parent.base[ property ] === true ,
				actual = parent.computeModifiers( base , base , parent.pathKey + '.' + property ) ;
			if ( actual ) { keys.add( property ) ; }
			else { keys.delete( property ) ; }
		}
		
		console.error( "keys:" , keys ) ;
		return [ ... keys ] ;
	} ,
	getOwnPropertyDescriptor: ( target , property ) => {
		if ( ! property || typeof property !== 'string' ) { return ; }
		return {

// TEMP:
			value: null ,
			writable: false ,
			// Mandatory, for some reason .ownKeys() is always cross-checking each props using getOwnPropertyDescriptor().enumerable
			enumerable: true ,
			configurable: true
		} ;
	}
} ;

Traits.ACTUAL_HANDLER = ACTUAL_HANDLER ;

