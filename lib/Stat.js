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



function Stat( base = null , parentTable = null , pathKey = null ) {
	this[ common.SYMBOL_PARENT ] = parentTable ;
	this.pathKey = pathKey ;
	this.base = base ;
	this.constraints = null ;	// TODO?

	this.proxy = {} ;
}

module.exports = Stat ;



const NumberStat = require( './NumberStat.js' ) ;
const StringStat = require( './StringStat.js' ) ;
const TemplateStat = require( './TemplateStat.js' ) ;
const Traits = require( './Traits.js' ) ;
const CompoundStat = require( './CompoundStat.js' ) ;

const common = require( './common.js' ) ;



Stat.prototype.operandType = null ;
Stat.prototype.hasWildChildren = false ;

Stat.prototype.proxyMethods = {} ;
Stat.prototype.proxyProperties = {} ;
Stat.prototype.proxyWritableProperties = {} ;
Stat.prototype.proxyGetters = {} ;
Stat.prototype.proxySetters = {} ;



Stat.create = function( parentTable , pathKey , params , clone ) {
	// Here params is always considered as immutable object

	if ( params instanceof Stat ) { return params.clone( parentTable , pathKey ) ; }

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

	if ( params.__prototypeUID__ === 'kung-fig/TemplateSentence' ) {
		return new TemplateStat( params , parentTable , pathKey ) ;
	}

	throw new Error( "Stat.create(): bad parameters" ) ;
} ;



Stat.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new Stat( this.base , parentTable , pathKey ) ;
} ;



// Used when reassigning to a new parent
Stat.prototype.fixAttachment = function( to , key ) {
	if ( ! to[ common.SYMBOL_PARENT ] ) { return ; }

	var pathKey = to.pathKey ? to.pathKey + '.' + key : key ;

	if ( this[ common.SYMBOL_PARENT ] === to[ common.SYMBOL_PARENT ] && this.pathKey === pathKey ) { return ; }

	this[ common.SYMBOL_PARENT ] = to[ common.SYMBOL_PARENT ] ;
	this.pathKey = pathKey ;
	this.proxy = {} ;
} ;



// For instance, there is no difference between .set() and .setBase(), but this may change in the future
Stat.prototype.set =
Stat.prototype.setBase = function( base ) { this.base = base ; } ;
//Stat.prototype.setFromStat = function( stat ) { this.base = stat.base ; } ;
Stat.prototype.getBase = function() { return this.base ; } ;
Stat.prototype.getActual = function( pathKey = this.pathKey ) { return this.computeModifiers( this.base , this.base , pathKey ) ; } ;



Stat.computeModifiers = function( operandType , actual , base , modifiers ) {
	//console.error( "Stat.computeModifiers(): " , operandType , actual , base , modifiers ) ;
	if ( ! modifiers ) { return actual ; }

	// It should be already sorted, since it's sorted on insertion
	for ( let modifier of modifiers ) {
		if ( modifier.active ) { actual = modifier.apply( operandType , actual , base ) ; }
	}

	//console.error( "    -->" , actual , "\n\n" ) ;
	return actual ;
} ;

Stat.prototype.computeModifiers = function( actual , base , pathKey = this.pathKey ) {
	//console.error( "Stat#computeModifiers(): " , actual , base , pathKey ) ;
	//console.error( "stm:" , this[ common.SYMBOL_PARENT ]?.statsModifiers ) ;
	// [ common.SYMBOL_PARENT ] could be null, it happens when a stat is detached from the table.
	// E.g.: during Spellcast scripting init phase.
	return Stat.computeModifiers( this.operandType , actual , base , this[ common.SYMBOL_PARENT ]?.statsModifiers[ pathKey ] ) ;
} ;



Stat.prototype.getProxy = function( pathKey = this.pathKey ) {
	//if ( pathKey !== this.pathKey ) { console.log( "GET PROXY PATH KEY:" , pathKey , "instead of" , this.pathKey ) ; }
	if ( this.proxy[ pathKey ] ) { return this.proxy[ pathKey ] ; }
	return this.proxy[ pathKey ] = new Proxy( { target: this , pathKey } , STAT_HANDLER ) ;
} ;

// ...args is for derivated class
Stat.prototype.cloneProxy = function( ... args ) { return this.clone( ... args ).getProxy() ; } ;



const STAT_HANDLER = {
	get: ( { target , pathKey } , property ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === common.SYMBOL_PATH_KEY ) { return pathKey ; }		// Debug and unit test
		if ( property === 'constructor' ) { return target.constructor ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return target.cloneProxy.bind( target ) ; }

		if ( Object.hasOwn( target.proxyMethods , property ) ) {
			return target[ target.proxyMethods[ property ] ].bind( target ) ;
		}

		if ( Object.hasOwn( target.proxyProperties , property ) ) {
			return target[ target.proxyProperties[ property ] ] ;
		}

		if ( Object.hasOwn( target.proxyGetters , property ) ) {
			return target[ target.proxyGetters[ property ] ]( pathKey ) ;
		}

		if ( property === 'base' ) { return target.getBase() ; }
		if ( property === 'actual' ) { return target.getActual( pathKey ) ; }

		return ;
	} ,
	// Mostly a copy of .get()
	has: ( { target } , property ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return true ; }
		if ( property === common.SYMBOL_PATH_KEY ) { return true ; }
		if ( property === 'constructor' ) { return true ; }
		if ( property === 'toString' ) { return true ; }
		if ( property === 'clone' ) { return true ; }
		if ( property === 'base' ) { return true ; }
		if ( property === 'actual' ) { return true ; }

		if ( Object.hasOwn( target.proxyMethods , property ) ) { return true ; }
		if ( Object.hasOwn( target.proxyProperties , property ) ) { return true ; }
		if ( Object.hasOwn( target.proxyGetters , property ) ) { return true ; }

		return false ;
	} ,
	set: ( { target , pathKey } , property , value ) => {
		if ( target.proxyWritableProperties[ property ] ) {
			target[ target.proxyProperties[ property ] ] = value ;
			return true ;
		}

		if ( Object.hasOwn( target.proxySetters , property ) ) {
			return target[ target.proxySetters[ property ] ]( value , pathKey ) ;
		}

		if ( property === 'base' ) {
			target.setBase( value ) ;
			return true ;
		}

		return false ;
	} ,
	deleteProperty: () => false ,
	ownKeys: ( { target } ) => [ 'base' , 'actual' , ... Object.keys( target.proxyProperties ) , ... Object.keys( target.proxyGetters ) ] ,
	getOwnPropertyDescriptor: ( proxyTarget , property ) => {
		var target = proxyTarget.target ;

		// configurable:true is forced by Proxy Invariants
		if ( target.proxyProperties[ property ] ) {
			return {
				value: STAT_HANDLER.get( proxyTarget , target.proxyProperties[ property ] , proxyTarget ) , writable: true , enumerable: true , configurable: true
			} ;
		}

		if ( target.proxyGetters[ property ] ) {
			return {
				value: STAT_HANDLER.get( proxyTarget , target.proxyGetters[ property ] , proxyTarget ) , writable: true , enumerable: true , configurable: true
			} ;
		}

		if ( property === 'base' || property === 'actual' ) {
			return { value: STAT_HANDLER.get( proxyTarget , property , proxyTarget ) , enumerable: true , configurable: true } ;
		}
	} ,
	getPrototypeOf: ( { target } ) => Reflect.getPrototypeOf( target ) ,
	setPrototypeOf: () => false
} ;

Stat.STAT_HANDLER = STAT_HANDLER ;

