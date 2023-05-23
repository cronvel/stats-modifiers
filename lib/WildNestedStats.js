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



WildNestedStats.prototype.operandType = 'boolean' ;
WildNestedStats.prototype.hasWildChildren = true ;
WildNestedStats.prototype.wildBranch = 'template' ;
WildNestedStats.prototype.specialKeys = new Set( [ '_' , 'template' ] ) ;



WildNestedStats.prototype.clear = function() {
	common.clearObject( this.stats ) ;
} ;



WildNestedStats.prototype.setFromNestedStats = function( nestedStats , clone = true ) {
	//console.error( ".setFromNestedStats()" , nestedStats ) ;
	this.setStats( nestedStats.stats , clone ) ;
	if ( nestedStats instanceof WildNestedStats ) { this.setTemplate( nestedStats.template , clone ) ; }
} ;



WildNestedStats.prototype.setTemplate = function( templateStatValue , clone = true ) {
	return this.setStat( 'template' , templateStatValue , clone , this ) ;
} ;



WildNestedStats.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	//return new WildNestedStats( this.stats , parentTable , pathKey , true ) ;
	var clone = new WildNestedStats( null , parentTable , pathKey ) ;
	clone.setFromNestedStats( this , true ) ;
	return clone ;
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

	if ( this.template ) {
		this.template.fixAttachment( this , 'template' ) ;
	}
} ;



WildNestedStats.prototype.computeModifiers = function( actual , base , pathKey = this.pathKey ) {
	//console.error( "Stat#computeModifiers(): " , actual , base , pathKey ) ;
	//console.error( "stm:" , this[ common.SYMBOL_PARENT ]?.statsModifiers ) ;
	// [ common.SYMBOL_PARENT ] could be null, it happens when a stat is detached from the table.
	// E.g.: during Spellcast scripting init phase.
	return Stat.computeModifiers( this.operandType , actual , base , this[ common.SYMBOL_PARENT ]?.statsModifiers[ pathKey ] ) ;
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
	return this.actualProxy[ pathKey ] = new Proxy( { target: this , pathKey } , ACTUAL_HANDLER ) ;
} ;



const NESTED_HANDLER = {
	get: ( { target , pathKey } , property ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === common.SYMBOL_PATH_KEY ) { return pathKey ; }		// Debug and unit test
		if ( property === 'constructor' ) { return target.constructor ; }
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
	// Mostly a copy of .get()
	has: ( { target } , property ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return true ; }
		if ( property === common.SYMBOL_PATH_KEY ) { return true ; }        // Debug and unit test
		if ( property === 'constructor' ) { return true ; }
		if ( property === 'toString' ) { return true ; }
		if ( property === 'clone' ) { return true ; }

		if ( property === 'template' || property === '_' ) { return true ; }
		if ( property === 'base' ) { return true ; }
		if ( property === 'actual' ) { return true ; }

		return property in target.stats ;
	} ,
	set: ( { target } , property , value ) => {
		return target.setStat( property , value ) ;
	} ,
	deleteProperty: ( { target } , property ) => {
		if ( ! ( property in target.stats ) ) { return false ; }
		return delete target.stats[ property ] ;
	} ,
	ownKeys: ( { target } ) => [ 'template' , ... Object.keys( target.stats ) ] ,
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
	} ,
	getPrototypeOf: ( { target } ) => Reflect.getPrototypeOf( target ) ,
	setPrototypeOf: () => false
} ;

WildNestedStats.NESTED_HANDLER = NESTED_HANDLER ;



const BASE_HANDLER = {
	get: ( { target } , property ) => {
		//if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( ! property || typeof property !== 'string' ) { return null ; }

		var finalTarget = target.stats[ property ] ;
		if ( ! finalTarget ) { return ; }

		if ( finalTarget.getProxy ) { return finalTarget.getProxy() ; }
		//if ( typeof finalTarget === 'function' ) { return finalTarget.bind( target ) ; }
		return finalTarget ;
	} ,
	has: ( { target } , property ) => {
		return property in target.stats ;
	} ,
	set: ( { target } , property , value ) => {
		if ( ! property || typeof property !== 'string' ) { return false ; }
		return target.setStat( property , value ) ;
	} ,
	deleteProperty: ( { target } , property ) => {
		if ( ! ( property in target.stats ) ) { return false ; }
		return delete target.stats[ property ] ;
	} ,
	ownKeys: ( { target } ) => [ ... Object.keys( target.stats ) ] ,
	getOwnPropertyDescriptor: ( { target } , property ) => {
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
	} ,
	getPrototypeOf: () => Object.prototype ,
	setPrototypeOf: () => false
} ;

WildNestedStats.BASE_HANDLER = BASE_HANDLER ;



const ACTUAL_HANDLER = {
	get: ( { target , pathKey } , property ) => {
		//console.log( "Actual get handler" , property , target , target[ common.SYMBOL_PARENT ].computeModifiers) ;
		//if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( ! property || typeof property !== 'string' ) { return null ; }

		var baseExists = Object.hasOwn( target.stats , property ) ,
			actualExists = target.computeModifiers( baseExists , baseExists , pathKey + '.' + property ) ;

		//console.log( "Testing" , pathKey + '.' + property , baseExists , actualExists , target.stats ) ;
		if ( ! actualExists ) { return ; }

		var finalTarget = baseExists ? target.stats[ property ] : target.template ;
		if ( ! finalTarget ) { return ; }

		if ( finalTarget.getProxy ) { return finalTarget.getProxy( pathKey ? pathKey + '.' + property : property ) ; }
		//if ( typeof finalTarget === 'function' ) { return finalTarget.bind( target ) ; }
		return finalTarget ;
	} ,
	// Mostly a copy of .get()
	has: ( { target , pathKey } , property ) => {
		if ( ! property || typeof property !== 'string' ) { return false ; }

		var baseExists = Object.hasOwn( target.stats , property ) ,
			actualExists = target.computeModifiers( baseExists , baseExists , pathKey + '.' + property ) ;

		return actualExists ;
	} ,
	set: () => false ,
	deleteProperty: () => false ,
	ownKeys: ( { target , pathKey } ) => {
		var parent = target[ common.SYMBOL_PARENT ] ,
			keys = new Set( Object.keys( target.stats ) ) ;

		for ( let property in parent.wildChildrenModifierKeys[ pathKey ] ) {
			if ( ! property || typeof property !== 'string' ) { continue ; }

			let baseExists = Object.hasOwn( target.stats , property ) ,
				actualExists = target.computeModifiers( baseExists , baseExists , pathKey + '.' + property ) ;

			if ( actualExists ) { keys.add( property ) ; }
			else { keys.delete( property ) ; }
		}

		//console.error( "keys:" , keys ) ;
		return [ ... keys ] ;
	} ,
	getOwnPropertyDescriptor: ( { target , pathKey } , property ) => {
		if ( ! property || typeof property !== 'string' ) { return ; }

		var baseExists = Object.hasOwn( target.stats , property ) ,
			actualExists = target.computeModifiers( baseExists , baseExists , pathKey + '.' + property ) ;

		if ( ! actualExists ) { return ; }

		var finalTarget = baseExists ? target.stats[ property ] : target.template ;
		if ( ! finalTarget ) { return ; }

		if ( finalTarget.getProxy ) { finalTarget = finalTarget.getProxy( pathKey ? pathKey + '.' + property : property ) ; }

		return {
			value: finalTarget ,
			writable: false ,
			// Mandatory, for some reasons .ownKeys() is always cross-checking each props using getOwnPropertyDescriptor().enumerable
			enumerable: true ,
			configurable: true
		} ;
	} ,
	getPrototypeOf: () => Object.prototype ,
	setPrototypeOf: () => false
} ;

WildNestedStats.ACTUAL_HANDLER = ACTUAL_HANDLER ;

