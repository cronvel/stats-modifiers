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
	Traits stats are a collection of traits, or tags.
	They can be useful to add/remove properties to/from an entity.
*/

function Traits( base , parentTable = null , pathKey = null ) {
	Stat.call( this , {} , parentTable , pathKey ) ;

	if ( base ) { this.setBase( base ) ; }

	this.baseProxy = {} ;
	this.actualProxy = {} ;
}

const Stat = require( './Stat.js' ) ;
Traits.prototype = Object.create( Stat.prototype ) ;
Traits.prototype.constructor = Traits ;

module.exports = Traits ;



const common = require( './common.js' ) ;



Traits.prototype.operandType = 'boolean' ;
Traits.prototype.hasWildChildren = true ;

Traits.prototype.proxyMethods = {} ;
Traits.prototype.proxyProperties = {} ;
Traits.prototype.proxyWritableProperties = {} ;
Traits.prototype.proxyGetters = {} ;
Traits.prototype.proxySetters = {} ;



Traits.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new Traits( this.base , parentTable , pathKey ) ;
} ;



// Called by Spellcast when extending a data structure
Traits.prototype.set =
Traits.prototype.setBase = function( base ) {
	if ( Array.isArray( base ) || base instanceof Set ) {
		common.clearObject( this.base ) ;
		for ( let trait of base ) {
			if ( trait && typeof trait === 'string' ) {
				this.base[ trait ] = true ;
			}
		}

		return true ;
	}
	else if ( common.isPlainObject( base ) ) {
		common.clearObject( this.base ) ;
		for ( let trait in base ) {
			if ( trait && typeof trait === 'string' && base[ trait ] ) {
				this.base[ trait ] = true ;
			}
		}

		return true ;
	}
	else if ( base && typeof base === 'string' ) {
		common.clearObject( this.base ) ;
		this.base[ base ] = true ;
		return true ;
	}

	return false ;
} ;



Traits.prototype.getBase =
Traits.prototype.getBaseProxy = function( pathKey = this.pathKey ) {
	//if ( pathKey !== this.pathKey ) { console.log( "GET PROXY PATH KEY:" , pathKey , "instead of" , this.pathKey ) ; }
	if ( this.baseProxy[ pathKey ] ) { return this.baseProxy[ pathKey ] ; }
	return this.baseProxy[ pathKey ] = new Proxy( { target: this , pathKey } , BASE_HANDLER ) ;
} ;



Traits.prototype.getActual = function( pathKey = this.pathKey ) {
	//if ( pathKey !== this.pathKey ) { console.log( "GET PROXY PATH KEY:" , pathKey , "instead of" , this.pathKey ) ; }
	if ( this.actualProxy[ pathKey ] ) { return this.actualProxy[ pathKey ] ; }
	return this.actualProxy[ pathKey ] = new Proxy( { target: this , pathKey } , ACTUAL_HANDLER ) ;
} ;



Traits.prototype.clear = function() { common.clearObject( this.base ) ; } ;



const BASE_HANDLER = {
	get: ( { target } , property ) => {
		//if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( ! property || typeof property !== 'string' ) { return null ; }
		return target.base[ property ] === true ;
	} ,
	// Mostly a copy of .get()
	has: ( { target } , property ) => {
		if ( ! property || typeof property !== 'string' ) { return false ; }
		return target.base[ property ] === true ;
	} ,
	set: ( { target } , property , value ) => {
		if ( ! property || typeof property !== 'string' ) { return false ; }
		if ( value ) { target.base[ property ] = true ; }
		else { delete target.base[ property ] ; }
		return true ;
	} ,
	deleteProperty: () => false ,
	ownKeys: ( { target } ) => [ ... Object.keys( target.base ) ] ,
	getOwnPropertyDescriptor: ( { target }  , property ) => {
		if ( ! property || typeof property !== 'string' ) { return ; }

		return {
			value: target.base[ property ] === true ,
			writable: true ,
			// Mandatory, for some reasons .ownKeys() is always cross-checking each props using getOwnPropertyDescriptor().enumerable
			enumerable: true ,
			configurable: true
		} ;
	} ,
	getPrototypeOf: () => Object.prototype ,
	setPrototypeOf: () => false
} ;

Traits.BASE_HANDLER = BASE_HANDLER ;



const ACTUAL_HANDLER = {
	get: ( { target , pathKey }  , property ) => {
		//if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( ! property || typeof property !== 'string' ) { return null ; }
		var base = target.base[ property ] === true ;
		return target.computeModifiers( base , base , pathKey ? pathKey + '.' + property : property ) ;
	} ,
	// Mostly a copy of .get()
	has: ( { target , pathKey }  , property ) => {
		if ( ! property || typeof property !== 'string' ) { return false ; }
		var base = target.base[ property ] === true ;
		return !! target.computeModifiers( base , base , pathKey ? pathKey + '.' + property : property ) ;
	} ,
	set: () => false ,
	deleteProperty: () => false ,
	ownKeys: ( { target , pathKey } ) => {
		var parent = target[ common.SYMBOL_PARENT ] ,
			keys = new Set( Object.keys( target.base ) ) ;

		for ( let property in parent.wildChildrenModifierKeys[ pathKey ] ) {
			if ( ! property || typeof property !== 'string' ) { continue ; }

			let base = target.base[ property ] === true ,
				actual = target.computeModifiers( base , base , pathKey ? pathKey + '.' + property : property ) ;

			if ( actual ) { keys.add( property ) ; }
			else { keys.delete( property ) ; }
		}

		//console.error( "keys:" , keys ) ;
		return [ ... keys ] ;
	} ,
	getOwnPropertyDescriptor: ( { target , pathKey } , property ) => {
		if ( ! property || typeof property !== 'string' ) { return ; }

		var base = target.base[ property ] === true ,
			actual = target.computeModifiers( base , base , pathKey ? pathKey + '.' + property : property ) ;

		return {
			value: actual ,
			writable: false ,
			// Mandatory, for some reasons .ownKeys() is always cross-checking each props using getOwnPropertyDescriptor().enumerable
			enumerable: true ,
			configurable: true
		} ;
	} ,
	getPrototypeOf: () => Object.prototype ,
	setPrototypeOf: () => false
} ;

Traits.ACTUAL_HANDLER = ACTUAL_HANDLER ;

