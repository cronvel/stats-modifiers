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
	The most basic stat: it's just a number.
	It's also the default stat.
*/

function NumberStat( params = {} , parentTable = null , pathKey = null ) {
	var base =
		params && typeof params === 'object' ? + params.base || 0 :
		+ params || 0 ;

	Stat.call( this , base , parentTable , pathKey ) ;
}

const Stat = require( './Stat.js' ) ;
NumberStat.prototype = Object.create( Stat.prototype ) ;
NumberStat.prototype.constructor = NumberStat ;
NumberStat.prototype.__prototypeUID__ = 'stats-modifiers/NumberStat' ;

module.exports = NumberStat ;



const common = require( './common.js' ) ;



NumberStat.prototype.operandType = 'number' ;

/*
NumberStat.prototype.proxyMethods = {} ;
NumberStat.prototype.proxyProperties = {} ;
NumberStat.prototype.proxyWritableProperties = {} ;
NumberStat.prototype.proxyGetters = {} ;
NumberStat.prototype.proxySetters = {} ;
*/



NumberStat.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new NumberStat( this , parentTable , pathKey ) ;
} ;



// Called by Spellcast when extending a data structure
NumberStat.prototype.set = function( params ) {
	if ( typeof params === 'number' ) {
		this.setBase( params ) ;
		return true ;
	}

	return false ;
} ;



NumberStat.prototype.setBase = function( base ) {
	this.base = + base || 0 ;
	return true ;
} ;

