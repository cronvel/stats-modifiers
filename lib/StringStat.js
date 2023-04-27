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
	This is a string stat, like a name, description, quality, etc...
*/

function StringStat( params = {} , parentTable = null , pathKey = null ) {
	var base =
		params && typeof params === 'object' ? '' + params.base :
		'' + params ;

	Stat.call( this , base , parentTable , pathKey ) ;
}

StringStat.prototype = Object.create( Stat.prototype ) ;
StringStat.prototype.constructor = StringStat ;

module.exports = StringStat ;



StringStat.prototype.operandType = 'string' ;

/*
StringStat.prototype.proxyMethods = {} ;
StringStat.prototype.proxyProperties = {} ;
StringStat.prototype.proxyWritableProperties = {} ;
StringStat.prototype.proxyGetters = {} ;
StringStat.prototype.proxySetters = {} ;
StringStat.prototype.innerMods = new Set() ;
*/


StringStat.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new StringStat( this , parentTable , pathKey ) ;
} ;

