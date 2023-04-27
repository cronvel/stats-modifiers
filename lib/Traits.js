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
	Traits stats are a collection of traits, or tags.
	They can be useful to add/remove properties to/from an entity.
*/

function Traits( params = {} , parentTable = null , pathKey = null ) {
	var base =
		Array.isArray( params.base ) || params.base instanceof Set ? new Set( params.base ) :
		new Set() ;

	Stat.call( this , base , parentTable , pathKey ) ;
}

Traits.prototype = Object.create( Stat.prototype ) ;
Traits.prototype.constructor = Traits ;

module.exports = Traits ;



Traits.prototype.operandType = 'set' ;

Traits.prototype.proxyMethods = {
} ;

Traits.prototype.proxyProperties = {
} ;

Traits.prototype.proxyWritableProperties = {} ;

Traits.prototype.proxyGetters = {
} ;

Traits.prototype.proxySetters = {
} ;



Traits.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new Traits( this , parentTable , pathKey ) ;
} ;



Traits.prototype.getActual = function( pathKey = this.pathKey ) {
} ;

