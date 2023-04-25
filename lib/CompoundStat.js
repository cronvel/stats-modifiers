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
const StatsTable = require( './StatsTable.js' ) ;

const common = require( './common.js' ) ;
const compounds = require( './compounds.js' ) ;

const dotPath = require( 'tree-kit/lib/dotPath.js' ) ;



function CompoundStat( arg1 , arg2 , parentTable , pathKey ) {
	if ( arg2 instanceof StatsTable ) {
		pathKey = parentTable ;
		parentTable = arg2 ;
	}

	Stat.call( this , undefined , parentTable , pathKey ) ;

	this.baseFn = null ;
	this.actualFn = null ;
	this.statNames = null ;
	this.isBuiltin = true ;

	if ( typeof arg1 === 'string' ) {
		if ( ! compounds[ arg1 ] ) { throw new Error( "Unknown compound operator '" + arg1 + "'" ) ; }
		this.baseFn = this.actualFn = compounds[ arg1 ] ;
		this.statNames = Array.isArray( arg2 ) ? arg2 : [ arg2 ] ;
	}
	else if ( typeof arg1 === 'function' && typeof arg2 === 'function' ) {
		this.baseFn = arg1 ;
		this.actualFn = arg2 ;
		this.isBuiltin = false ;
	}
	else if ( arg1?.__prototypeUID__ === 'kung-fig/Expression' ) {
		this.baseFn = CompoundStat.expressionToFn( arg1 , 'base' ) ;
		this.actualFn = CompoundStat.expressionToFn( arg1 , 'actual' ) ;
		this.isBuiltin = false ;
	}
	else if ( arg1?.__prototypeUID__ === 'kung-fig/Ref' ) {
		this.baseFn = CompoundStat.refToFn( arg1 , 'base' ) ;
		this.actualFn = CompoundStat.refToFn( arg1 , 'actual' ) ;
		this.isBuiltin = false ;
	}
	else {
		throw new Error( "CompoundStat: bad operator type" ) ;
	}
}

CompoundStat.prototype = Object.create( Stat.prototype ) ;
CompoundStat.prototype.constructor = CompoundStat ;

module.exports = CompoundStat ;



CompoundStat.prototype.proxyMethods = {} ;
CompoundStat.prototype.proxyProperties = {} ;
CompoundStat.prototype.proxyWritableProperties = {} ;
CompoundStat.prototype.proxyGetters = {} ;
CompoundStat.prototype.proxySetters = {} ;



CompoundStat.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return this.isBuiltin ?
		new CompoundStat( this.actualFn.id , [ ... this.statNames ] , parentTable , pathKey ) :
		new CompoundStat( this.baseFn , this.actualFn , parentTable , pathKey ) ;
} ;



CompoundStat.prototype.getBase = function() {
	if ( this.isBuiltin ) {
		return this.baseFn( this.statNames.map( statName => {
			var stat = dotPath.get( this[ common.SYMBOL_PARENT ].stats , statName ) ;

			// /!\ Wildcard stats are not supported ATM /!\
			return stat instanceof Stat ? stat.getBase() : null ;
		} ) ) ;
	}

	return this.baseFn( this[ common.SYMBOL_PARENT ].getProxy() ) ;
} ;



CompoundStat.prototype.getActual = function( pathKey = this.pathKey ) {
	var actual ,
		base = this.getBase() ;

	if ( this.isBuiltin ) {
		actual = this.actualFn( this.statNames.map( statName => {
			var stat = dotPath.get( this[ common.SYMBOL_PARENT ].stats , statName ) ;

			// /!\ Wildcard stats are not supported ATM /!\
			return stat instanceof Stat ? stat.getActual() : null ;
		} ) ) ;
	}
	else {
		actual = this.actualFn( this[ common.SYMBOL_PARENT ].getProxy() ) ;
	}

	return this.computeModifiers( actual , base , pathKey ) ;
} ;



// Patch Kung Fig expression, to append .actual to each ref
CompoundStat.patchExpressionRef = function( expression , suffix ) {
	for ( let arg of expression.args ) {
		if ( arg && typeof arg === 'object' ) {
			if ( arg.__prototypeUID__ === 'kung-fig/Ref' ) { arg.appendPart( suffix ) ; }
			else if ( arg.__prototypeUID__ === 'kung-fig/Expression' ) { CompoundStat.patchExpressionRef( arg , suffix ) ; }
		}
	}
} ;



CompoundStat.expressionToFn = function( expression , suffix = null ) {
	// Do not modify the original Expression, coming from the KFG
	if ( suffix ) {
		expression = expression.clone() ;
		CompoundStat.patchExpressionRef( expression , suffix ) ;
	}

	return expression.compile() ;
} ;



CompoundStat.refToFn = function( ref_ , suffix = null ) {
	// Do not modify the original Expression, coming from the KFG
	if ( suffix ) {
		ref_ = ref_.clone() ;
		ref_.appendPart( suffix ) ;
	}

	return ref_.compile() ;
} ;

