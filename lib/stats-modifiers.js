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



const lib = {} ;
module.exports = lib ;



function StatsTable( stats = null ) {
	this.stats = {} ;
	this.modifiersTables = [] ;
	this.proxy = null ;			// TODO
	this.upToDate = false ;
	
	if ( stats ) {
		for ( let name in stats ) { this.addStat( name , stats[ name ] ) ; }
	}
}

lib.StatsTable = StatsTable ;



function Stat( base ) {
	this.base = base ;
	this.actual = this.base ;
	this.sub = {} ;	// sub-stats, like regen, and so on
	this.modifiers = [] ;
	this.constraints = null ;	// TODO
}

lib.Stat = Stat ;




function Modifier() {
	this.id = null ;
	this.operator = null ;
	this.value = null ;
}

lib.Modifier = Modifier ;



function ModifiersTable() {
	this.id = null ;
	this.modifiers = [] ;
}

lib.ModifiersTable = ModifiersTable ;







