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



Stat.prototype.operandType = null ;

Stat.prototype.proxyMethods = {} ;
Stat.prototype.proxyProperties = {} ;
Stat.prototype.proxyWritableProperties = {} ;
Stat.prototype.proxyGetters = {} ;
Stat.prototype.proxySetters = {} ;
Stat.prototype.innerMods = new Set() ;



const NumberStat = require( './NumberStat.js' ) ;
const StringStat = require( './StringStat.js' ) ;
const Traits = require( './Traits.js' ) ;
const CompoundStat = require( './CompoundStat.js' ) ;



Stat.create = function( parentTable , pathKey , params , clone ) {
	// Considered as immutable object
	var type = common.autoTypeOf( params ) ;
	//console.log( "Stat.create():" , type , params ) ;

	if ( type === 'number' ) { return new NumberStat( params , parentTable , pathKey ) ; }
	if ( type === 'string' ) { return new StringStat( params , parentTable , pathKey ) ; }
	if ( type === 'set' ) { return new Traits( params , parentTable , pathKey ) ; }

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



Stat.computeModifiers = function( operandType , actual , base , modifiers ) {
	if ( modifiers ) {
		// It should be already sorted, since it's sorted on insertion
		for ( let modifier of modifiers ) {
			if ( modifier.active ) { actual = modifier.apply( operandType , actual , base ) ; }
		}
	}

	return actual ;
} ;

Stat.prototype.computeModifiers = function( actual , base , pathKey = this.pathKey ) {
	// [ common.SYMBOL_PARENT ] could be null, it happens when a stat is detached from the table.
	// E.g.: during Spellcast scripting init phase.
	return Stat.computeModifiers( this.operandType , actual , base , this[ common.SYMBOL_PARENT ]?.statsModifiers[ pathKey ] ) ;
} ;



Stat.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , STAT_HANDLER ) ;
	return this.proxy ;
} ;



const getTargetPath = ( target , receiver ) =>
	target[ common.SYMBOL_PARENT ] ? target[ common.SYMBOL_PARENT ].proxyToMeta.get( receiver )?.path : undefined ;



const STAT_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return Stat ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return target.cloneProxy.bind( target ) ; }

		if ( Object.hasOwn( target.proxyMethods , property ) ) {
			return target[ target.proxyMethods[ property ] ].bind( target ) ;
		}

		if ( Object.hasOwn( target.proxyProperties , property ) ) {
			return target[ target.proxyProperties[ property ] ] ;
		}

		if ( Object.hasOwn( target.proxyGetters , property ) ) {
			return target[ target.proxyGetters[ property ] ]( getTargetPath( target , receiver ) ) ;
		}

		if ( property === 'base' ) { return target.getBase() ; }
		if ( property === 'actual' ) { return target.getActual( getTargetPath( target , receiver ) ) ; }

		return ;
	} ,
	set: ( target , property , value , receiver ) => {
		if ( target.proxyWritableProperties[ property ] ) {
			target[ target.proxyProperties[ property ] ] = value ;
			return true ;
		}

		if ( Object.hasOwn( target.proxySetters , property ) ) {
			return target[ target.proxySetters[ property ] ]( value , getTargetPath( target , receiver ) ) ;
		}

		if ( property === 'base' ) {
			target.setBase( value ) ;
			return true ;
		}

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

