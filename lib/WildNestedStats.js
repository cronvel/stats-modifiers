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
	NestedStats.prototype.fixAttachment.call( this , to , key ) ;
	this.template.fixAttachment( this , 'template' ) ;
} ;



WildNestedStats.prototype.getProxy = function() {
    if ( this.proxy ) { return this.proxy ; }
    this.proxy = new Proxy( this , NESTED_HANDLER ) ;
    return this.proxy ;
} ;

// ...args is for derivated class
WildNestedStats.prototype.cloneProxy = function( ... args ) { return this.clone( ... args ).getProxy() ; } ;



const NESTED_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return Object ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return target.cloneProxy.bind( target ) ; }

		if ( property === 'template' || property === '_' ) { return target.template && target.template.getProxy() ; }

		var finalTarget = target.stats[ property ] ;
		if ( ! finalTarget ) { return ; }

		/*
		console.log( "??? t:" , target ) ;
		console.log( "??? p:" , property ) ;
		console.log( "??? t[p]:" , target.stats[ property ] ) ;
		//*/

		if ( finalTarget.getProxy ) { return finalTarget.getProxy() ; }
		if ( typeof finalTarget === 'function' ) { return finalTarget.bind( target ) ; }
		return finalTarget ;
	} ,
	set: ( target , property , value , receiver ) => {
		return target.setStat( property , value ) ;
	}
} ;

WildNestedStats.NESTED_HANDLER = NESTED_HANDLER ;

