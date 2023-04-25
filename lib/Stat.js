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



const common = require( './common.js' ) ;



function Stat( base = null , parentTable = null , pathKey = null ) {
	this[ common.SYMBOL_PARENT ] = parentTable ;
	this.pathKey = pathKey ;
	this.base = base ;
	this.constraints = null ;	// TODO?
	this.proxy = null ;
}

module.exports = Stat ;



const CompoundStat = require( './CompoundStat.js' ) ;



Stat.prototype.proxyMethods = {} ;
Stat.prototype.proxyProperties = {} ;
Stat.prototype.proxyWritableProperties = {} ;
Stat.prototype.proxyGetters = {} ;
Stat.prototype.proxySetters = {} ;



Stat.create = function( parentTable , pathKey , params , clone ) {
	if ( ! params || typeof params !== 'object' ) { return new Stat( params , parentTable , pathKey ) ; }

	// First, unproxy it if necessary
	if ( params[ common.SYMBOL_UNPROXY ] ) { params = params[ common.SYMBOL_UNPROXY ] ; }

	// Stat and all derivated
	if ( params instanceof Stat ) {
		if ( clone ) { return params.clone( parentTable , pathKey ) ; }
		params[ common.SYMBOL_PARENT ] = parentTable ;
		params.pathKey = pathKey ;
		return params ;
	}

	if ( params.__prototypeUID__ === 'kung-fig/Operator' ) {
		return new CompoundStat( params.operator , params.operand , parentTable , pathKey ) ;
	}

	if ( params.__prototypeUID__ === 'kung-fig/Expression' || params.__prototypeUID__ === 'kung-fig/Ref' ) {
		return new CompoundStat( params , parentTable , pathKey ) ;
	}

	// Considered as immutable object
	if ( ! common.isPlainObjectOrArray( params ) ) { return new Stat( params , parentTable , pathKey ) ; }

	throw new Error( "Stat.create(): bad parameters" ) ;
} ;



Stat.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new Stat( this.base , parentTable , pathKey ) ;
} ;

// ...args is for derivated class
Stat.prototype.cloneProxy = function( ... args ) { return this.clone( ... args ).getProxy() ; } ;

// For instance, there is no difference between .set() and .setBase(), but this may change in the future
Stat.prototype.set =
Stat.prototype.setBase = function( base ) { this.base = base ; } ;
Stat.prototype.getBase = function() { return this.base ; } ;
Stat.prototype.getActual = function( pathKey = this.pathKey ) { return this.computeModifiers( this.base , this.base , pathKey ) ; } ;



Stat.computeModifiers = function( actual , base , modifiers ) {
	if ( modifiers ) {
		// It should be already sorted, since it's sorted on insertion
		for ( let modifier of modifiers ) {
			if ( modifier.active ) { actual = modifier.apply( actual , base ) ; }
		}
	}

	return actual ;
} ;

Stat.prototype.computeModifiers = function( actual , base , pathKey = this.pathKey ) {
	// [ common.SYMBOL_PARENT ] could be null, it happens when a stat is detached from the table.
	// E.g.: during Spellcast scripting init phase.
	return Stat.computeModifiers( actual , base , this[ common.SYMBOL_PARENT ]?.statsModifiers[ pathKey ] ) ;
} ;



Stat.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , STAT_HANDLER ) ;
	return this.proxy ;
} ;



// Because it is only used on controlled internal stuffs:
/* eslint-disable no-prototype-builtins */

const STAT_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return Stat ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return target.cloneProxy.bind( target ) ; }

		if ( target.proxyMethods.hasOwnProperty( property ) ) {
			return target[ target.proxyMethods[ property ] ].bind( target ) ;
		}

		if ( target.proxyProperties.hasOwnProperty( property ) ) {
			return target[ target.proxyProperties[ property ] ] ;
		}

		if ( target.proxyGetters.hasOwnProperty( property ) ) {
			return target[ target.proxyGetters[ property ] ]() ;
		}

		var targetPath = target[ common.SYMBOL_PARENT ] ? target[ common.SYMBOL_PARENT ].proxyToMeta.get( receiver )?.path : undefined ;
		//console.log( "stat get:" , targetPath ) ;

		if ( property === 'base' ) { return target.getBase() ; }
		if ( property === 'actual' ) { return target.getActual( targetPath ) ; }

		//if ( STAT_PROXY_LOCAL.has( property ) ) { return Reflect.get( target , property , receiver ) ; }

		return ;
	} ,
	set: ( target , property , value , receiver ) => {
		if ( target.proxyWritableProperties[ property ] ) {
			//return Reflect.set( target , target.proxyWritableProperties[ property ] , value , receiver ) ;
			target[ target.proxyProperties[ property ] ] = value ;
			return true ;
		}

		if ( property === 'base' ) {
			target.setBase( value ) ;
			return true ;
		}

		//if ( STAT_PROXY_METHODS.has( property ) ) { return false ; }
		//if ( property === 'actual' ) { return false ; }

		return false ;
	} ,
	ownKeys: ( target ) => 
		[ 'base' , 'actual' , ... Object.keys( target.proxyProperties ) , ... Object.keys( target.proxyGetters ) ]
	,
	getOwnPropertyDescriptor: ( target , property ) => {
		// configurable:true is forced by Proxy Invariants
		if ( target.proxyProperties[ property ] ) {
			return { value: STAT_HANDLER.get( target , target.proxyProperties[ property ] , target ) , writable: true , configurable: true } ;
		}

		if ( property === 'base' || property === 'actual' ) {
			return { value: STAT_HANDLER.get( target , property , target ) , configurable: true } ;
		}
	}
} ;

Stat.STAT_HANDLER = STAT_HANDLER ;

