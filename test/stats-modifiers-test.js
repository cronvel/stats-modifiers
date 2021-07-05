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

/* global describe, it, expect */

"use strict" ;



const lib = require( '..' ) ;



describe( "Basic usage" , () => {

	it( "StatsTable creation" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: 20
		} ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( stats.getProxy().strength.base ).to.be( 12 ) ;
	} ) ;

	it( "ModifiersTable creation" , () => {
		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ [ '+' , 5 ] ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;
		
		expect( mods.statsModifiers.strength ).to.be.partially.like( { '': { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } } ) ;
		expect( mods.getProxy().strength ).to.be.partially.like( { '': { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } } ) ;

		expect( mods.statsModifiers.dexterity ).to.be.partially.like( { '': {
			minus: { id: 'staff' , operator: 'minus' , operand: 2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} } ) ;
		expect( mods.getProxy().dexterity ).to.be.partially.like( { '': {
			minus: { id: 'staff' , operator: 'minus' , operand: 2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} } ) ;
	} ) ;
	
	it( "Adding a ModifiersTable to a StatsTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: 20
		} ) ;
		
		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ [ '+' , 5 ] ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;
		
		stats.stack( mods ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( stats.getProxy().strength.base ).to.be( 12 ) ;

		expect( stats.stats.strength.actual ).to.be( 17 ) ;
		expect( stats.getProxy().strength.actual ).to.be( 17 ) ;

		expect( stats.stats.dexterity.actual ).to.be( 10 ) ;
	} ) ;
} ) ;

