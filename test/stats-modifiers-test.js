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
		
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
	} ) ;

	it( "ModifiersTable creation" , () => {
		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;
		
		var modsP = mods.getProxy() ;
		
		expect( mods.statsModifiers.strength ).to.be.partially.like( { '': { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } } ) ;
		expect( modsP.strength ).to.be.partially.like( { '': { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } } ) ;

		expect( mods.statsModifiers.dexterity ).to.be.partially.like( { '': {
			minus: { id: 'staff' , operator: 'minus' , operand: 2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} } ) ;
		expect( modsP.dexterity ).to.be.partially.like( { '': {
			minus: { id: 'staff' , operator: 'minus' , operand: 2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} } ) ;
	} ) ;
	
	it( "Adding/removing a ModifiersTable to a StatsTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: 20
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.actual ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 12 ) ;
		expect( stats.stats.dexterity.actual ).to.be( 15 ) ;

		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;
		

		stats.stack( mods ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.actual ).to.be( 17 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( stats.stats.dexterity.actual ).to.be( 10 ) ;


		stats.unstack( mods ) ;

		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.actual ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 12 ) ;
		expect( stats.stats.dexterity.actual ).to.be( 15 ) ;


		var mods2 = new lib.ModifiersTable( 'ring-of-strength' , {
			strength: [ '+' , 2 ]
		} ) ;
		
		stats.stack( mods ) ;
		stats.stack( mods2 ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.actual ).to.be( 19 ) ;
		expect( statsP.strength.actual ).to.be( 19 ) ;
		expect( stats.stats.dexterity.actual ).to.be( 10 ) ;
	} ) ;
	
	it( "Updating base value of a StatsTable having a ModifiersTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: 20
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;
		
		stats.stack( mods ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.actual ).to.be( 17 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( stats.stats.dexterity.actual ).to.be( 10 ) ;
		
		// Modify a stat using direct stat access
		stats.stats.strength.set( 10 ) ;

		expect( stats.stats.strength.base ).to.be( 10 ) ;
		expect( statsP.strength.base ).to.be( 10 ) ;
		expect( stats.stats.strength.actual ).to.be( 15 ) ;
		expect( statsP.strength.actual ).to.be( 15 ) ;
		
		// Modify a stat through proxy
		statsP.strength = 8 ;

		expect( stats.stats.strength.base ).to.be( 8 ) ;
		expect( statsP.strength.base ).to.be( 8 ) ;
		expect( stats.stats.strength.actual ).to.be( 13 ) ;
		expect( statsP.strength.actual ).to.be( 13 ) ;
	} ) ;
	
	it( "Active and inactive modifiers" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: 20
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'staff' , { dexterity: [ '-' , 2 ] } , true ) ,
			mods2 = new lib.ModifiersTable( 'agile-spell' , { dexterity: [ '+' , 5 ] } , false ) ;
		
		stats.stack( mods ) ;
		
		expect( stats.stats.dexterity.actual ).to.be( 13 ) ;
		
		mods2.setActive( true ) ;
		expect( stats.stats.dexterity.actual ).to.be( 18 ) ;

		mods.setActive( false ) ;
		expect( stats.stats.dexterity.actual ).to.be( 20 ) ;
	} ) ;
} ) ;



describe( "Sub-stats" , () => {

	it( "StatsTable creation with sub-stats" , () => {
		var stats = new lib.StatsTable( {
			hp: {
				base: 20 ,
				regen: 3 ,
				injury: 7
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.hp.base ).to.be( 20 ) ;
		expect( statsP.hp.base ).to.be( 20 ) ;

		expect( stats.stats.hp.sub.regen.base ).to.be( 3 ) ;
		expect( stats.stats.hp.sub.injury.base ).to.be( 7 ) ;
		expect( statsP.hp.regen.base ).to.be( 3 ) ;
		expect( statsP.hp.injury.base ).to.be( 7 ) ;

		statsP.hp.injury.base = 12 ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
	} ) ;
} ) ;

