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



function WildNestedStats( stats = null , parentTable = null , pathKey = null , clone = false ) {
	NestedStats.call( this , stats , parentTable , pathKey , clone ) ;

	this.template = null ;

	this.baseProxy = {} ;
	this.actualProxy = {} ;

	var template = stats && ( stats.template || stats._ ) ;
	if ( template ) { this.setTemplate( template ) ; }
}

const NestedStats = require( './NestedStats.js' ) ;
WildNestedStats.prototype = Object.create( NestedStats.prototype ) ;
WildNestedStats.prototype.constructor = WildNestedStats ;

module.exports = WildNestedStats ;



const Stat = require( './Stat.js' ) ;
const common = require( './common.js' ) ;
const arrayKit = require( 'array-kit' ) ;



WildNestedStats.prototype.operandType = null ;
WildNestedStats.prototype.specialKeys = new Set( [ '_' , 'template' ] ) ;



WildNestedStats.prototype.clear = function() {
	common.clearObject( this.stats ) ;
} ;



WildNestedStats.prototype.setTemplate = function( templateStatValue , clone = true ) {
	return this.setStat( 'template' , templateStatValue , clone , this ) ;
} ;



WildNestedStats.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new WildNestedStats( this.stats , parentTable , pathKey , true ) ;
} ;



WildNestedStats.prototype.fixAttachment = function( to , key ) {
	if ( ! to[ common.SYMBOL_PARENT ] ) { return ; }

	var pathKey = to.pathKey ? to.pathKey + '.' + key : key ;

	if ( this[ common.SYMBOL_PARENT ] === to[ common.SYMBOL_PARENT ] && this.pathKey === pathKey ) { return ; }

	this[ common.SYMBOL_PARENT ] = to[ common.SYMBOL_PARENT ] ;
	this.pathKey = pathKey ;
	this.proxy = {} ;
	this.baseProxy = {} ;
	this.actualProxy = {} ;

	for ( let property in this.stats ) {
		this.stats[ property ].fixAttachment( this , property ) ;
	}

	this.template.fixAttachment( this , 'template' ) ;
} ;



WildNestedStats.prototype.getProxy = function( pathKey = this.pathKey ) {
	if ( this.proxy[ pathKey ] ) { return this.proxy[ pathKey ] ; }
	return this.proxy[ pathKey ] = new Proxy( { target: this , pathKey } , NESTED_HANDLER ) ;
} ;

// ...args is for derivated class
WildNestedStats.prototype.cloneProxy = function( ... args ) { return this.clone( ... args ).getProxy() ; } ;



WildNestedStats.prototype.getBase =
WildNestedStats.prototype.getBaseProxy = function( pathKey = this.pathKey ) {
	if ( this.baseProxy[ pathKey ] ) { return this.baseProxy[ pathKey ] ; }
	return this.baseProxy[ pathKey ] = new Proxy( { target: this , pathKey } , BASE_HANDLER ) ;
} ;



WildNestedStats.prototype.getActual = function( pathKey = this.pathKey ) {
	if ( this.actualProxy[ pathKey ] ) { return this.actualProxy[ pathKey ] ; }
	return this.actualProxy[ pathKey ] = new Proxy( { target: this , pathKey } , BASE_HANDLER ) ;
} ;



const NESTED_HANDLER = {
	get: ( { target , pathKey } , property , receiver ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === common.SYMBOL_PATH_KEY ) { return pathKey ; }		// Debug and unit test
		if ( property === 'constructor' ) { return Object ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return target.cloneProxy.bind( target ) ; }

		if ( property === 'template' || property === '_' ) { return target.template && target.template.getProxy( pathKey ? pathKey + '.template' : 'template' ) ; }
		if ( property === 'base' ) { return target.getBase( pathKey ) ; }
		if ( property === 'actual' ) { return target.getActual( pathKey ) ; }

		var finalTarget = target.stats[ property ] ;
		if ( ! finalTarget ) { return ; }

		/*
		console.log( "??? t:" , target ) ;
		console.log( "??? p:" , property ) ;
		console.log( "??? t[p]:" , target.stats[ property ] ) ;
		//*/

		if ( finalTarget?.getProxy ) { return finalTarget.getProxy( pathKey ? pathKey + '.' + property : property ) ; }
		if ( typeof finalTarget === 'function' ) { return finalTarget.bind( target ) ; }
		return finalTarget ;
	} ,
	set: ( { target , pathKey } , property , value , receiver ) => {
		return target.setStat( property , value ) ;
	} ,
	ownKeys: ( { target , pathKey } ) => [ 'template' , ... Object.keys( target.stats ) ] ,
	getOwnPropertyDescriptor: ( { target , pathKey } , property ) => {
		if ( ! property || typeof property !== 'string' ) { return ; }

		var finalTarget ;

		if ( property === 'template' || property === '_' ) {
			finalTarget = target.template ;
		}
		else {
			finalTarget = target.stats[ property ] ;
		}

		if ( ! finalTarget ) { return ; }

		return {
			value: finalTarget?.getProxy ? finalTarget.getProxy( pathKey ? pathKey + '.' + property : property ) : finalTarget ,
			writable: true ,
			// Mandatory, for some reasons .ownKeys() is always cross-checking each props using getOwnPropertyDescriptor().enumerable
			enumerable: true ,
			configurable: true
		} ;
	}
} ;

WildNestedStats.NESTED_HANDLER = NESTED_HANDLER ;



const BASE_HANDLER = {
	get: ( { target , pathKey } , property , receiver ) => {
		//if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( ! property || typeof property !== 'string' ) { return null ; }

		var finalTarget = target.stats[ property ] ;
		if ( ! finalTarget ) { return ; }

		if ( finalTarget.getProxy ) { return finalTarget.getProxy() ; }
		//if ( typeof finalTarget === 'function' ) { return finalTarget.bind( target ) ; }
		return finalTarget ;
	} ,
	set: ( { target , pathKey } , property , value , receiver ) => {
		if ( ! property || typeof property !== 'string' ) { return false ; }
		return target.setStat( property , value ) ;
	} ,
	ownKeys: ( { target , pathKey } ) => [ ... Object.keys( target.stats ) ] ,
	getOwnPropertyDescriptor: ( { target , pathKey } , property ) => {
		if ( ! property || typeof property !== 'string' ) { return ; }

		var finalTarget = target.stats[ property ] ;
		if ( ! finalTarget ) { return ; }

		return {
			value: finalTarget?.getProxy ? finalTarget.getProxy() : finalTarget , 
			writable: true ,
			// Mandatory, for some reasons .ownKeys() is always cross-checking each props using getOwnPropertyDescriptor().enumerable
			enumerable: true ,
			configurable: true
		} ;
	}
} ;

WildNestedStats.BASE_HANDLER = BASE_HANDLER ;



const ACTUAL_HANDLER = {
	get: ( { target , pathKey } , property , receiver ) => {
		//if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( ! property || typeof property !== 'string' ) { return null ; }

		var finalTarget ,
			parent = target[ common.SYMBOL_PARENT ] ,
			baseExists = !! parent.stats[ property ] ,
			actualExists = parent.computeModifiers( baseExists , baseExists , parent.pathKey + '.' + property ) ;
		
		if ( ! actualExists ) { return ; }

		
		if ( baseExists ) { 
			finalTarget = parent.stats[ property ] ;
			if ( ! finalTarget ) { return ; }

			if ( finalTarget.getProxy ) { return finalTarget.getProxy( pathKey ? pathKey + '.' + property : property ) ; }
			//if ( typeof finalTarget === 'function' ) { return finalTarget.bind( target ) ; }
			return finalTarget ;
		}
		
		// Complex case
		finalTarget = parent.template ;
		if ( ! finalTarget ) { return ; }
	} ,
	set: () => false ,
	ownKeys: ( { target , pathKey } ) => {
		var parent = target[ common.SYMBOL_PARENT ] ,
			parentTable = parent[ common.SYMBOL_PARENT ] ,
			keys = new Set( Object.keys( parent.base ) ) ;
		
		for ( let property in parentTable.wildChildrenModifierKeys[ parent.pathKey ] ) {
			if ( ! property || typeof property !== 'string' ) { continue ; }

			let base = parent.base[ property ] === true ,
				actual = parent.computeModifiers( base , base , parent.pathKey + '.' + property ) ;

			if ( actual ) { keys.add( property ) ; }
			else { keys.delete( property ) ; }
		}
		
		//console.error( "keys:" , keys ) ;
		return [ ... keys ] ;
	} ,
	getOwnPropertyDescriptor: ( { target , pathKey } , property ) => {
		if ( ! property || typeof property !== 'string' ) { return ; }

		var parent = target[ common.SYMBOL_PARENT ] ,
			base = parent.base[ property ] === true ,
			actual = parent.computeModifiers( base , base , parent.pathKey + '.' + property ) ;

		if ( ! actual ) { return ; }

		return {
			value: actual ,
			writable: false ,
			// Mandatory, for some reasons .ownKeys() is always cross-checking each props using getOwnPropertyDescriptor().enumerable
			enumerable: true ,
			configurable: true
		} ;
	}
} ;

WildNestedStats.ACTUAL_HANDLER = ACTUAL_HANDLER ;

