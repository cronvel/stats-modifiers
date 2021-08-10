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
const Expression = require( 'kung-fig-expression' ) ;



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

	it( "StatsTable with nested stats creation" , () => {
		var stats = new lib.StatsTable( {
			hp: {
				max: 20 ,
				remaining: 14
			} ,
			damages: [
				{ type: 'cutting' , damage: 24 } ,
				{ type: 'fire' , damage: 8 }
			]
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( stats.stats.hp.remaining.base ).to.be( 14 ) ;
		expect( statsP.hp.remaining.base ).to.be( 14 ) ;

		expect( stats.stats.damages[ 0 ].damage.base ).to.be( 24 ) ;
		expect( statsP.damages[ 0 ].damage.base ).to.be( 24 ) ;
		expect( stats.stats.damages[ 1 ].damage.base ).to.be( 8 ) ;
		expect( statsP.damages[ 1 ].damage.base ).to.be( 8 ) ;
	} ) ;

	it( "StatsTable clone" , () => {
		var stats = new lib.StatsTable( {
			hp: {
				max: 20 ,
				remaining: 14
			} ,
			damages: [
				{ type: 'cutting' , damage: 24 } ,
				{ type: 'fire' , damage: 8 }
			]
		} ) ;
		
		var statsClone = stats.clone() ;
		expect( statsClone ).not.to.be( stats ) ;
		expect( statsClone ).to.equal( stats ) ;
		expect( stats.stats.hp.max ).to.be.a( lib.Stat ) ;
		expect( statsClone.stats.hp.max ).to.be.a( lib.Stat ) ;

		expect( statsClone.stats.hp.max.base ).to.be( 20 ) ;
		expect( statsClone.stats.hp.remaining.base ).to.be( 14 ) ;
		expect( statsClone.stats.damages[ 0 ].damage.base ).to.be( 24 ) ;
		expect( statsClone.stats.damages[ 1 ].damage.base ).to.be( 8 ) ;

		// Check that they are distinct
		statsClone.stats.hp.max.base = 17 ;
		expect( stats.stats.hp.max.base ).to.be( 20 ) ;
		expect( statsClone.stats.hp.max.base ).to.be( 17 ) ;

		stats.stats.hp.max.base = 21 ;
		expect( stats.stats.hp.max.base ).to.be( 21 ) ;
		expect( statsClone.stats.hp.max.base ).to.be( 17 ) ;
	} ) ;

	it( "StatsTable extension" , () => {
		var stats = new lib.StatsTable( {
			useless: 123 ,
			hp: {
				max: 20 ,
				remaining: 14 ,
				useless: 123
			} ,
			damages: [
				{ type: 'cutting' , damage: 24 } ,
				{ type: 'fire' , damage: 8 }
			]
		} ) ;
		
		var extendedStats = stats.extend( {
			useless: null ,	// it removes it
			strength: 10 ,
			hp: {
				injury: 3 ,
				useless: null	// it removes it
			} ,
			damages: [
				{ type: 'electricity' , damage: 4 }
			]
		} ) ;

		expect( extendedStats.stats.strength.base ).to.be( 10 ) ;
		expect( extendedStats.stats.hp.max.base ).to.be( 20 ) ;
		expect( extendedStats.stats.hp.remaining.base ).to.be( 14 ) ;
		expect( extendedStats.stats.hp.injury.base ).to.be( 3 ) ;
		expect( extendedStats.stats.damages ).to.have.a.length.of( 1 ) ;
		expect( extendedStats.stats.damages[ 0 ].damage.base ).to.be( 4 ) ;

		// Check stat removal
		expect( stats.stats.useless.base ).to.be( 123 ) ;
		expect( extendedStats.stats.useless ).to.be.undefined() ;
		expect( stats.stats.hp.useless.base ).to.be( 123 ) ;
		expect( extendedStats.stats.hp.useless ).to.be.undefined() ;
	} ) ;

	it( "ModifiersTable creation" , () => {
		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;
		
		var modsP = mods.getProxy() ;
		
		expect( mods.statsModifiers.strength ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsP.strength ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;

		expect( mods.statsModifiers.dexterity ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: -2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
		expect( modsP.dexterity ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: -2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
	} ) ;
	
	it( "ModifiersTable for nested stats creation" , () => {
		var mods = new lib.ModifiersTable( 'staff' , {
			"hp.max": [ '+' , 5 ] ,
			"damages.0.damage": [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;
		
		var modsP = mods.getProxy() ;
		
		expect( mods.statsModifiers['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;

		expect( mods.statsModifiers['damages.0.damage'] ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: -2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
		expect( modsP['damages.0.damage'] ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: -2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
	} ) ;
	
	it( "ModifiersTable creation using the object syntax (KFG)" , () => {
		var mods = new lib.ModifiersTable( 'staff' , {
			strength: { operator: '+' , operand: 5 } ,
			dexterity: [ { operator: '-' , operand: 2 } , { operator: '*' , operand: 0.8 } ] ,
			"hp.max": [ '+' , 2 ]
		} ) ;
		
		var modsP = mods.getProxy() ;
		
		expect( mods.statsModifiers.strength ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsP.strength ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 2 } } ) ;

		expect( mods.statsModifiers.dexterity ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: -2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
		expect( modsP.dexterity ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: -2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
	} ) ;
	
	it( "ModifiersTable clone" , () => {
		var mods = new lib.ModifiersTable( 'staff' , {
			"hp.max": [ '+' , 5 ] ,
			"damages.0.damage": [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;
		
		var modsP = mods.getProxy() ;
		var modsClone = mods.clone( false ) ;
		var modsCloneP = modsClone.getProxy() ;

		expect( modsClone ).not.to.be( mods ) ;
		expect( modsClone.id ).to.be( mods.id ) ;
		expect( modsClone ).to.equal( mods ) ;
		expect( modsClone.statsModifiers['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsCloneP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;

		expect( modsClone.statsModifiers['damages.0.damage'] ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: -2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
		expect( modsCloneP['damages.0.damage'] ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: -2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;

		// Check that there are distinct
		modsCloneP['hp.max'].plus.operand = 7 ;
		expect( modsP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsCloneP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 7 } } ) ;

		modsP['hp.max'].plus.operand = 3 ;
		expect( modsP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 3 } } ) ;
		expect( modsCloneP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 7 } } ) ;


		// Regular clone, changing the ID
		mods = new lib.ModifiersTable( 'staff' , {
			"hp.max": [ '+' , 5 ] ,
			"damages.0.damage": [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;
		
		modsP = mods.getProxy() ;
		modsClone = mods.clone() ;
		modsCloneP = modsClone.getProxy() ;

		expect( modsClone ).not.to.be( mods ) ;
		expect( modsClone.id ).not.to.be( mods.id ) ;
		expect( modsClone ).not.to.equal( mods ) ;
		expect( modsClone.statsModifiers['hp.max'] ).to.be.partially.like( { plus: { id: 'staff_clone_0' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsCloneP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff_clone_0' , operator: 'plus' , operand: 5 } } ) ;

		expect( modsClone.statsModifiers['damages.0.damage'] ).to.be.partially.like( {
			plus: { id: 'staff_clone_0' , operator: 'plus' , operand: -2 } ,
			multiply: { id: 'staff_clone_0' , operator: 'multiply' , operand: 0.8 }
		} ) ;
		expect( modsCloneP['damages.0.damage'] ).to.be.partially.like( {
			plus: { id: 'staff_clone_0' , operator: 'plus' , operand: -2 } ,
			multiply: { id: 'staff_clone_0' , operator: 'multiply' , operand: 0.8 }
		} ) ;

		// Check that there are distinct
		modsCloneP['hp.max'].plus.operand = 7 ;
		expect( modsP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsCloneP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff_clone_0' , operator: 'plus' , operand: 7 } } ) ;

		modsP['hp.max'].plus.operand = 3 ;
		expect( modsP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 3 } } ) ;
		expect( modsCloneP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff_clone_0' , operator: 'plus' , operand: 7 } } ) ;
	} ) ;
	
	it( "Adding/removing a ModifiersTable to a StatsTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: {
				max: 20 ,
				remaining: 14
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 12 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 15 ) ;

		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ] ,
			"hp.max": [ '+' , 2 ]
		} ) ;
		

		statsP.stack( mods ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 17 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( stats.stats.hp.max.getActual() ).to.be( 22 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;


		statsP.unstack( mods ) ;

		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 12 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 15 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( stats.stats.hp.max.getActual() ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;


		var mods2 = new lib.ModifiersTable( 'ring-of-strength' , {
			strength: [ '+' , 2 ] ,
			"hp.remaining": [ '+' , 1 ]
		} ) ;
		
		stats.stack( mods ) ;
		stats.stack( mods2 ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 19 ) ;
		expect( statsP.strength.actual ).to.be( 19 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( stats.stats.hp.max.getActual() ).to.be( 22 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;
		expect( statsP.hp.remaining.base ).to.be( 14 ) ;
		expect( stats.stats.hp.remaining.getActual() ).to.be( 15 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 15 ) ;
	} ) ;
	
	it( "Should prevent multiple stacking of the same ModifiersTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: {
				max: 20 ,
				remaining: 14
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 12 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 15 ) ;

		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ] ,
			"hp.max": [ '+' , 2 ]
		} ) ;
		

		stats.stack( mods ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 17 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( stats.stats.hp.max.getActual() ).to.be( 22 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;
		

		stats.stack( mods ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 17 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( stats.stats.hp.max.getActual() ).to.be( 22 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;


		stats.stack( mods ) ;
		stats.stack( mods ) ;
		stats.stack( mods ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 17 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( stats.stats.hp.max.getActual() ).to.be( 22 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;
	} ) ;
		
	it( "Updating base value of a StatsTable having a ModifiersTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: {
				max: 20 ,
				remaining: 14
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ] ,
			"hp.max": [ '+' , 2 ]
		} ) ;
		
		stats.stack( mods ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 17 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;
		
		// Modify a stat using direct stat access
		stats.stats.strength.set( 10 ) ;

		expect( stats.stats.strength.base ).to.be( 10 ) ;
		expect( statsP.strength.base ).to.be( 10 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 15 ) ;
		expect( statsP.strength.actual ).to.be( 15 ) ;
		
		// Modify a stat through proxy
		statsP.strength = 8 ;

		expect( stats.stats.strength.base ).to.be( 8 ) ;
		expect( statsP.strength.base ).to.be( 8 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 13 ) ;
		expect( statsP.strength.actual ).to.be( 13 ) ;

		statsP.strength.base = 6 ;

		expect( stats.stats.strength.base ).to.be( 6 ) ;
		expect( statsP.strength.base ).to.be( 6 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 11 ) ;
		expect( statsP.strength.actual ).to.be( 11 ) ;

		statsP.hp.max.base = 26 ;

		expect( statsP.hp.max.base ).to.be( 26 ) ;
		expect( statsP.hp.max.actual ).to.be( 28 ) ;
	} ) ;
		
	it( "Updating a ModifiersTable already stacked on a StatsTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: {
				max: 20 ,
				remaining: 14
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ] ,
			"hp.max": [ '+' , 2 ]
		} ) ;
		
		var modsP = mods.getProxy() ;

		stats.stack( mods ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 17 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;
		
		mods.statsModifiers.strength.plus.set( 7 ) ;

		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 19 ) ;
		expect( statsP.strength.actual ).to.be( 19 ) ;

		// Modify a stat modifier using direct modifier access
		modsP.strength.plus = 4 ;

		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 16 ) ;
		expect( statsP.strength.actual ).to.be( 16 ) ;
		
		modsP.strength.multiply = 2 ;

		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 28 ) ;
		expect( statsP.strength.actual ).to.be( 28 ) ;

		modsP['hp.max'].plus = 5 ;

		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 25 ) ;
	} ) ;
	
	it( "Accessing a ModifiersTable from a StatsTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: {
				max: 20 ,
				remaining: 14
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;

		var mods2 = new lib.ModifiersTable( 'ring-of-strength' , {
			strength: [ '+' , 2 ] ,
			"hp.max": [ '+' , 1 ]
		} ) ;
		
		stats.stack( mods ) ;
		stats.stack( mods2 ) ;

		expect( statsP.modifiersTables['staff'].strength ).to.be.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: 5 }
		} ) ;
		expect( statsP.modifiersTables['staff'].dexterity ).to.be.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: -2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
		// 'mods' alias
		expect( statsP.mods['ring-of-strength'].strength ).to.be.like( {
			plus: { id: 'ring-of-strength' , operator: 'plus' , operand: 2 }
		} ) ;
		expect( statsP.mods['ring-of-strength']['hp.max'] ).to.be.like( {
			plus: { id: 'ring-of-strength' , operator: 'plus' , operand: 1 }
		} ) ;
	} ) ;
	
	it( "Activate and deactivate modifiers" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: {
				max: 20 ,
				remaining: 14
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'staff' , { dexterity: [ '-' , 2 ] } , true ) ,
			mods2 = new lib.ModifiersTable( 'agile-spell' , { dexterity: [ '+' , 5 ] } , false ) ,
			mods3 = new lib.ModifiersTable( 'life-spell' , { "hp.max": [ '+' , 3 ] } , false ) ;
		
		stats.stack( mods ) ;
		stats.stack( mods2 ) ;
		stats.stack( mods3 ) ;
		
		expect( stats.stats.dexterity.getActual() ).to.be( 13 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;
		
		mods2.activate() ;
		expect( stats.stats.dexterity.getActual() ).to.be( 18 ) ;
		expect( statsP.dexterity.actual ).to.be( 18 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;

		mods.deactivate() ;
		expect( stats.stats.dexterity.getActual() ).to.be( 20 ) ;
		expect( statsP.dexterity.actual ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;

		mods3.deactivate() ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;

		mods3.activate() ;
		expect( statsP.hp.max.actual ).to.be( 23 ) ;

		mods3.deactivate() ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;
	} ) ;
} ) ;



describe( "ModifiersTable templates" , () => {

	it( "ModifiersTable template creation" , () => {
		var modsTemplate = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ] ,
			"hp.max": [ '+' , 1 ]
		} , undefined , true ) ;
		
		var mods = modsTemplate.instanciate() ;
		//console.log( "mods:" , mods , mods.statsModifiers ) ;
		expect( mods.id ).to.be( 'staff_0' ) ;

		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: {
				max: 20 ,
				remaining: 14
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		statsP.stack( modsTemplate ) ;

		expect( stats.modifiersTables[ 0 ] ).to.be.partially.like( {
			id: 'staff_1' ,
			statsModifiers: {
				strength: {
					plus: { id: 'staff_1' , operator: 'plus' , operand: 5 }
				} ,
				dexterity: {
					plus: { id: 'staff_1' , operator: 'plus' , operand: -2 } ,
					multiply: { id: 'staff_1' , operator: 'multiply' , operand: 0.8 }
				} ,
				"hp.max": {
					plus: { id: 'staff_1' , operator: 'plus' , operand: 1 }
				}
			}
		} ) ;
	} ) ;

	it( "templates should support events instanciation" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		var mods = new lib.ModifiersTable(
			'dexterity-spell' ,
			{ dexterity: [ '+' , 9 ] } ,
			true ,
			true ,
			[ { name: 'new-turn' , every: 2 , action: 'fade' , amount: 3 } ]
		) ;
		
		statsP.stack( mods ) ;
		expect( statsP.mods['dexterity-spell'] ).to.be.undefined() ;
		expect( statsP.mods['dexterity-spell_0'] ).to.be.an( Object ) ;

		expect( statsP.dexterity.actual ).to.be( 19 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 19 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 16 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 16 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;


		statsP.stack( mods ) ;
		expect( statsP.mods['dexterity-spell'] ).to.be.undefined() ;
		expect( statsP.mods['dexterity-spell_0'] ).to.be.undefined() ;
		expect( statsP.mods['dexterity-spell_1'] ).to.be.an( Object ) ;

		expect( statsP.dexterity.actual ).to.be( 19 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 19 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 16 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 16 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
	} ) ;
} ) ;



describe( "Extending a ModifiersTable" , () => {

	it( "Extending a ModifiersTable with another" , () => {
		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ] ,
		} ) ;

		var wellMade = new lib.ModifiersTable( 'well-made' , {
			strength: [ '+' , 1 ] ,
			dexterity: [ [ '+' , 1 ] , [ '*' , 1.125 ] ] ,
		} ) ;
		
		var mods1 = mods.clone( 'well-made-staff' ).extend( wellMade ) ;
		//console.log( "mods:" , mods , mods.statsModifiers ) ;
		expect( mods1.id ).to.be( 'well-made-staff' ) ;

		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		statsP.stack( mods1 ) ;

		expect( stats.modifiersTables[ 0 ] ).to.be.partially.like( {
			id: 'well-made-staff' ,
			statsModifiers: {
				strength: {
					plus: { id: 'well-made-staff' , operator: 'plus' , operand: 6 }
				} ,
				dexterity: {
					plus: { id: 'well-made-staff' , operator: 'plus' , operand: -1 } ,
					multiply: { id: 'well-made-staff' , operator: 'multiply' , operand: 0.9 }
				}
			}
		} ) ;
	} ) ;
} ) ;



describe( "Compound stats" , () => {

	it( "Compound stats creation" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: new lib.CompoundStat( 'average' , [ 'reflex' , 'dexterity' ] ) ,
			hp: {
				max: 20 ,
				injury: 12 ,
				remaining: new lib.CompoundStat( 'minus' , [ 'hp.max' , 'hp.injury' ] )
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 13 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 8 ) ;
	} ) ;

	it( "Compound stats should use modifiers of primary stats" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: new lib.CompoundStat( 'average' , [ 'reflex' , 'dexterity' ] ) ,
			hp: {
				max: 20 ,
				injury: 12 ,
				remaining: new lib.CompoundStat( 'minus' , [ 'hp.max' , 'hp.injury' ] )
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 13 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 8 ) ;

		var mods = new lib.ModifiersTable( 'ring-of-dexterity-and-vitality' , {
			dexterity: [ '+' , 4 ] ,
			"hp.max": [ '+' , 1 ] ,
		} ) ;
		
		var modsP = mods.getProxy() ;

		statsP.stack( modsP ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 15 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 21 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 9 ) ;

		var mods2 = new lib.ModifiersTable( 'helm-of-defense' , {
			defense: [ '+' , 3 ] ,
			"hp.remaining": [ '+' , 2 ]
		} ) ;

		var mods2P = mods2.getProxy() ;

		statsP.stack( mods2P ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 18 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 21 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 11 ) ;
	} ) ;

	it( "Compound stats using custom function" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: new lib.CompoundStat(
				stats => ( 2 * stats.reflex.base + stats.dexterity.base ) / 3 ,
				stats => ( 2 * stats.reflex.actual + stats.dexterity.actual ) / 3
			) ,
			hp: {
				max: 20 ,
				injury: 12 ,
				remaining: new lib.CompoundStat(
					stats => stats.hp.max.base - stats.hp.injury.base ,
					stats => stats.hp.max.actual - stats.hp.injury.actual
				)
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( statsP.defense.base ).to.be( 14 ) ;
		expect( statsP.defense.actual ).to.be( 14 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 8 ) ;


		var mods = new lib.ModifiersTable( 'ring-of-dexterity' , { dexterity: [ '+' , 3 ] } ) ;
		var mods2 = new lib.ModifiersTable( 'ring-of-defense' , { defense: [ '+' , 1 ] } ) ;

		statsP.stack( mods ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.defense.base ).to.be( 14 ) ;
		expect( statsP.defense.actual ).to.be( 15 ) ;

		statsP.stack( mods2 ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.defense.base ).to.be( 14 ) ;
		expect( statsP.defense.actual ).to.be( 16 ) ;
	} ) ;

	it( "Compound stats and KFG interoperability: Operator syntax" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: { __prototypeUID__: 'kung-fig/Operator' , operator: 'average' , operand: [ 'reflex' , 'dexterity' ] } ,
			hp: {
				max: 20 ,
				injury: 12 ,
				remaining: { __prototypeUID__: 'kung-fig/Operator' , operator: 'minus' , operand: [ 'hp.max' , 'hp.injury' ] }
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 13 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 8 ) ;


		var mods = new lib.ModifiersTable( 'ring-of-dexterity' , { dexterity: [ '+' , 3 ] } ) ;
		var mods2 = new lib.ModifiersTable( 'ring-of-defense' , { defense: [ '+' , 1 ] } ) ;

		statsP.stack( mods ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 14.5 ) ;

		statsP.stack( mods2 ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 15.5 ) ;
	} ) ;
	
	it( "Compound stats and KFG interoperability: Expression syntax" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: Expression.parse( "( ( 2 * $reflex ) + $dexterity ) / 3" ) ,
			hp: {
				max: 20 ,
				injury: 12 ,
				remaining: Expression.parse( "$hp.max - $hp.injury" )
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( statsP.defense.base ).to.be( 14 ) ;
		expect( statsP.defense.actual ).to.be( 14 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 8 ) ;


		var mods = new lib.ModifiersTable( 'ring-of-dexterity' , { dexterity: [ '+' , 3 ] } ) ;
		var mods2 = new lib.ModifiersTable( 'ring-of-defense' , { defense: [ '+' , 1 ] } ) ;

		statsP.stack( mods ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.defense.base ).to.be( 14 ) ;
		expect( statsP.defense.actual ).to.be( 15 ) ;

		statsP.stack( mods2 ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.defense.base ).to.be( 14 ) ;
		expect( statsP.defense.actual ).to.be( 16 ) ;
	} ) ;

	it( "Compound stats clone" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: new lib.CompoundStat( 'average' , [ 'reflex' , 'dexterity' ] )
		} ) ;
		
		var statsClone = stats.clone() ;
		expect( statsClone ).not.to.be( stats ) ;
		expect( statsClone ).to.equal( stats ) ;
		expect( stats.stats.reflex ).to.be.a( lib.Stat ) ;
		expect( statsClone.stats.reflex ).to.be.a( lib.Stat ) ;
		expect( stats.stats.defense ).to.be.a( lib.CompoundStat ) ;
		expect( statsClone.stats.defense ).to.be.a( lib.CompoundStat ) ;
		expect( statsClone.stats.defense ).not.to.be( stats.stats.defense ) ;

		expect( statsClone.stats.reflex.base ).to.be( 16 ) ;
		expect( statsClone.stats.dexterity.base ).to.be( 10 ) ;
		expect( statsClone.stats.defense.getBase() ).to.be( 13 ) ;

		// Check that they are distinct
		statsClone.stats.reflex.base = 18 ;
		expect( stats.stats.reflex.base ).to.be( 16 ) ;
		expect( statsClone.stats.reflex.base ).to.be( 18 ) ;
		expect( stats.stats.defense.getBase() ).to.be( 13 ) ;
		expect( statsClone.stats.defense.getBase() ).to.be( 14 ) ;
	} ) ;
} ) ;



describe( "Gauge stats" , () => {

	it( "Gauge stats creation and adding entry to it" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 1 , min: 0 , max: 1 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		console.log( stats.stats.hp ) ;
		
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be( 1 ) ;
		
		statsP.hp.add( -0.2 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.8 ) ;

		statsP.hp.add( -0.1 , 0.5 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.7 ) ;

		statsP.hp.add( -0.3 , 0.8 , "hit by a rock" ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.4 ) ;

		expect( statsP.hp.entries ).to.be.like( [
			{ value: -0.2 , weight: 1 , description: null } ,
			{ value: -0.1 , weight: 0.5 , description: null } ,
			{ value: -0.3 , weight: 0.8 , description: "hit by a rock" }
		] ) ;
	} ) ;
	
	it( "Gauge stats and recover" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 1 , min: 0 , max: 1 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		console.log( stats.stats.hp ) ;
		
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be( 1 ) ;
		
		statsP.hp.add( -0.2 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.8 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -0.2 , weight: 1 , description: null }
		] ) ;

		statsP.hp.recover( 0.1 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.9 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -0.1 , weight: 1 , description: null }
		] ) ;

		statsP.hp.recover( 0.1 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 1 ) ;
		expect( statsP.hp.entries ).to.be.like( [] ) ;
		
		statsP.hp.add( -0.2 , 2 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.8 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -0.2 , weight: 2 , description: null }
		] ) ;

		statsP.hp.recover( 0.1 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.85 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -0.15 , weight: 2 , description: null }
		] ) ;
	} ) ;
	
	return ;

	it( "Compound stats should use modifiers of primary stats" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: new lib.CompoundStat( 'average' , [ 'reflex' , 'dexterity' ] ) ,
			hp: {
				max: 20 ,
				injury: 12 ,
				remaining: new lib.CompoundStat( 'minus' , [ 'hp.max' , 'hp.injury' ] )
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 13 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 8 ) ;

		var mods = new lib.ModifiersTable( 'ring-of-dexterity-and-vitality' , {
			dexterity: [ '+' , 4 ] ,
			"hp.max": [ '+' , 1 ] ,
		} ) ;
		
		var modsP = mods.getProxy() ;

		statsP.stack( modsP ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 15 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 21 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 9 ) ;

		var mods2 = new lib.ModifiersTable( 'helm-of-defense' , {
			defense: [ '+' , 3 ] ,
			"hp.remaining": [ '+' , 2 ]
		} ) ;

		var mods2P = mods2.getProxy() ;

		statsP.stack( mods2P ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 18 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 21 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 11 ) ;
	} ) ;

	it( "Compound stats using custom function" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: new lib.CompoundStat(
				stats => ( 2 * stats.reflex.base + stats.dexterity.base ) / 3 ,
				stats => ( 2 * stats.reflex.actual + stats.dexterity.actual ) / 3
			) ,
			hp: {
				max: 20 ,
				injury: 12 ,
				remaining: new lib.CompoundStat(
					stats => stats.hp.max.base - stats.hp.injury.base ,
					stats => stats.hp.max.actual - stats.hp.injury.actual
				)
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( statsP.defense.base ).to.be( 14 ) ;
		expect( statsP.defense.actual ).to.be( 14 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 8 ) ;


		var mods = new lib.ModifiersTable( 'ring-of-dexterity' , { dexterity: [ '+' , 3 ] } ) ;
		var mods2 = new lib.ModifiersTable( 'ring-of-defense' , { defense: [ '+' , 1 ] } ) ;

		statsP.stack( mods ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.defense.base ).to.be( 14 ) ;
		expect( statsP.defense.actual ).to.be( 15 ) ;

		statsP.stack( mods2 ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.defense.base ).to.be( 14 ) ;
		expect( statsP.defense.actual ).to.be( 16 ) ;
	} ) ;

	it( "Compound stats and KFG interoperability: Operator syntax" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: { __prototypeUID__: 'kung-fig/Operator' , operator: 'average' , operand: [ 'reflex' , 'dexterity' ] } ,
			hp: {
				max: 20 ,
				injury: 12 ,
				remaining: { __prototypeUID__: 'kung-fig/Operator' , operator: 'minus' , operand: [ 'hp.max' , 'hp.injury' ] }
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 13 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 8 ) ;


		var mods = new lib.ModifiersTable( 'ring-of-dexterity' , { dexterity: [ '+' , 3 ] } ) ;
		var mods2 = new lib.ModifiersTable( 'ring-of-defense' , { defense: [ '+' , 1 ] } ) ;

		statsP.stack( mods ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 14.5 ) ;

		statsP.stack( mods2 ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.defense.base ).to.be( 13 ) ;
		expect( statsP.defense.actual ).to.be( 15.5 ) ;
	} ) ;
	
	it( "Compound stats and KFG interoperability: Expression syntax" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: Expression.parse( "( ( 2 * $reflex ) + $dexterity ) / 3" ) ,
			hp: {
				max: 20 ,
				injury: 12 ,
				remaining: Expression.parse( "$hp.max - $hp.injury" )
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( statsP.defense.base ).to.be( 14 ) ;
		expect( statsP.defense.actual ).to.be( 14 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;
		expect( statsP.hp.injury.base ).to.be( 12 ) ;
		expect( statsP.hp.injury.actual ).to.be( 12 ) ;
		expect( statsP.hp.remaining.base ).to.be( 8 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 8 ) ;


		var mods = new lib.ModifiersTable( 'ring-of-dexterity' , { dexterity: [ '+' , 3 ] } ) ;
		var mods2 = new lib.ModifiersTable( 'ring-of-defense' , { defense: [ '+' , 1 ] } ) ;

		statsP.stack( mods ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.defense.base ).to.be( 14 ) ;
		expect( statsP.defense.actual ).to.be( 15 ) ;

		statsP.stack( mods2 ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.defense.base ).to.be( 14 ) ;
		expect( statsP.defense.actual ).to.be( 16 ) ;
	} ) ;

	it( "Compound stats clone" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: new lib.CompoundStat( 'average' , [ 'reflex' , 'dexterity' ] )
		} ) ;
		
		var statsClone = stats.clone() ;
		expect( statsClone ).not.to.be( stats ) ;
		expect( statsClone ).to.equal( stats ) ;
		expect( stats.stats.reflex ).to.be.a( lib.Stat ) ;
		expect( statsClone.stats.reflex ).to.be.a( lib.Stat ) ;
		expect( stats.stats.defense ).to.be.a( lib.CompoundStat ) ;
		expect( statsClone.stats.defense ).to.be.a( lib.CompoundStat ) ;
		expect( statsClone.stats.defense ).not.to.be( stats.stats.defense ) ;

		expect( statsClone.stats.reflex.base ).to.be( 16 ) ;
		expect( statsClone.stats.dexterity.base ).to.be( 10 ) ;
		expect( statsClone.stats.defense.getBase() ).to.be( 13 ) ;

		// Check that they are distinct
		statsClone.stats.reflex.base = 18 ;
		expect( stats.stats.reflex.base ).to.be( 16 ) ;
		expect( statsClone.stats.reflex.base ).to.be( 18 ) ;
		expect( stats.stats.defense.getBase() ).to.be( 13 ) ;
		expect( statsClone.stats.defense.getBase() ).to.be( 14 ) ;
	} ) ;
} ) ;



describe( "Receiving events" , () => {

	it( "One-time events" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		var mods = new lib.ModifiersTable( 'dexterity-spell' , {
			dexterity: [ '+' , 4 ]
		} ) ;
		
		mods.setOneTimeEvent( 'new-turn' , 'remove' ) ;
		
		statsP.stack( mods ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		statsP.trigger( 'new-turn' ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
	} ) ;

	it( "Countdown events" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		var mods = new lib.ModifiersTable( 'dexterity-spell-next-turn' , {
			dexterity: [ '+' , 4 ]
		} , false ) ;
		
		mods.setOneTimeEvent( 'new-turn' , 'activate' ) ;
		mods.setCountdownEvent( 'new-turn' , 3 , 'remove' ) ;
		
		statsP.stack( mods ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		statsP.trigger( 'new-turn' ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		statsP.trigger( 'new-turn' ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		statsP.trigger( 'new-turn' ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
	} ) ;

	it( "Recurring events with 'fade' action" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		var mods = new lib.ModifiersTable( 'dexterity-spell' , {
			dexterity: [ '+' , 4 ]
		} ) ;
		
		mods.setRecurringEvent( 'new-turn' , 'fade' ) ;
		
		statsP.stack( mods ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 12 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 11 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
	} ) ;

	it( "Recurring every X events with 'fade' action" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		var mods = new lib.ModifiersTable( 'dexterity-spell' , {
			dexterity: [ '+' , 9 ]
		} ) ;
		
		mods.setEveryEvent( 'new-turn' , 2 , 'fade' , { amount: 3 } ) ;
		
		statsP.stack( mods ) ;
		expect( statsP.dexterity.actual ).to.be( 19 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 19 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 16 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 16 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
	} ) ;

	it( ".setEvent() object API" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		var mods = new lib.ModifiersTable( 'dexterity-spell' , {
			dexterity: [ '+' , 9 ]
		} ) ;
		
		mods.setEvent( { name: 'new-turn' , every: 2 , action: 'fade' , amount: 3 } ) ;
		
		statsP.stack( mods ) ;
		expect( statsP.dexterity.actual ).to.be( 19 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 19 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 16 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 16 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		statsP.trigger( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
	} ) ;
} ) ;



describe( "Operators" , () => {

	it( "+ and * natural priority order" , () => {
		var stats = new lib.StatsTable( { dexterity: 14 } ) ;
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 14 ) ;

		var mods = new lib.ModifiersTable( 'clumsy-ring' , {
			dexterity: [ [ '+' , 2 ] , [ '*' , 0.5 ] ]
		} ) ;
		
		statsP.stack( mods ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 9 ) ;

		statsP.unstack( mods ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 14 ) ;

		var mods2 = new lib.ModifiersTable( 'clumsy-ring' , {
			dexterity: [ [ '*' , 0.5 ] , [ '+' , 2 ] ]
		} ) ;
		
		statsP.stack( mods2 ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 9 ) ;
	} ) ;

	it( "+ and * modified priority order" , () => {
		var stats = new lib.StatsTable( { dexterity: 14 } ) ;
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 14 ) ;

		var mods = new lib.ModifiersTable( 'clumsy-ring' , {
			dexterity: [ [ '+' , 2 , 1 ] , [ '*' , 0.5 ] ]
		} ) ;
		
		statsP.stack( mods ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 8 ) ;
	} ) ;

	it( "set (=) operator" , () => {
		var stats = new lib.StatsTable( { dexterity: 14 } ) ;
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 14 ) ;

		var mods = new lib.ModifiersTable( 'mediocre-ring' , {
			dexterity: [ '=' , 8 ]
		} ) ;
		
		var mods2 = new lib.ModifiersTable( 'agility-ring' , {
			dexterity: [ '+' , 2 ]
		} ) ;
		
		statsP.stack( mods ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 8 ) ;

		// No effect!
		statsP.stack( mods2 ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 8 ) ;

		stats = new lib.StatsTable( { dexterity: 5 } ) ;
		statsP = stats.getProxy() ;
		
		expect( stats.stats.dexterity.base ).to.be( 5 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 5 ) ;

		statsP.stack( mods ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 5 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 8 ) ;

		// No effect!
		statsP.stack( mods2 ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 5 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 8 ) ;
	} ) ;

	it( "atLeast (>=) operator" , () => {
		var stats = new lib.StatsTable( { dexterity: 14 } ) ;
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 14 ) ;

		var mods = new lib.ModifiersTable( 'hermes-ring' , {
			dexterity: [ '>=' , 30 ]
		} ) ;
		
		var mods2 = new lib.ModifiersTable( 'agility-ring' , {
			dexterity: [ '+' , 2 ]
		} ) ;
		
		statsP.stack( mods ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 30 ) ;

		// No effect!
		statsP.stack( mods2 ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 30 ) ;

		stats = new lib.StatsTable( { dexterity: 40 } ) ;
		statsP = stats.getProxy() ;
		
		expect( stats.stats.dexterity.base ).to.be( 40 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 40 ) ;

		statsP.stack( mods ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 40 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 40 ) ;

		// HAS effect!
		statsP.stack( mods2 ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 40 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 42 ) ;
	} ) ;

	it( "atMost (<=) operator" , () => {
		var stats = new lib.StatsTable( { dexterity: 14 } ) ;
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 14 ) ;

		var mods = new lib.ModifiersTable( 'ultimate-curse-ring' , {
			dexterity: [ '<=' , 3 ]
		} ) ;
		
		var mods2 = new lib.ModifiersTable( 'agility-ring' , {
			dexterity: [ '+' , 2 ]
		} ) ;
		
		statsP.stack( mods ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 3 ) ;

		// No effect!
		statsP.stack( mods2 ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 3 ) ;

		stats = new lib.StatsTable( { dexterity: 1 } ) ;
		statsP = stats.getProxy() ;
		
		expect( stats.stats.dexterity.base ).to.be( 1 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 1 ) ;

		statsP.stack( mods ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 1 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 1 ) ;

		// HAS effect!
		statsP.stack( mods2 ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 1 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 3 ) ;
	} ) ;

	it( "base (:) operator" , () => {
		var stats = new lib.StatsTable( { dexterity: 14 } ) ;
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 14 ) ;

		var mods = new lib.ModifiersTable( 'mediocre-ring' , {
			dexterity: [ ':' , 8 ]
		} ) ;
		
		var mods2 = new lib.ModifiersTable( 'agility-ring' , {
			dexterity: [ '+' , 2 ]
		} ) ;
		
		statsP.stack( mods ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 8 ) ;

		// HAS effect!
		statsP.stack( mods2 ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 14 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;

		stats = new lib.StatsTable( { dexterity: 5 } ) ;
		statsP = stats.getProxy() ;
		
		expect( stats.stats.dexterity.base ).to.be( 5 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 5 ) ;

		statsP.stack( mods ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 5 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 8 ) ;

		// HAS effect!
		statsP.stack( mods2 ) ;
		
		expect( stats.stats.dexterity.base ).to.be( 5 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;
	} ) ;

	it( "percent (%) operator (works with KFG percent numbers)" , () => {
		var stats = new lib.StatsTable( { dexterity: 10 } ) ;
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.dexterity.base ).to.be( 10 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;

		var mods = new lib.ModifiersTable( 'agility-ring' , { dexterity: [ '%' , 1.2 ] } ) ;
		var mods2 = new lib.ModifiersTable( 'agility-ring2' , { dexterity: [ '%' , 1.3 ] } ) ;
		var mods3 = new lib.ModifiersTable( 'agility-ring3' , { dexterity: [ '%' , 1.4 ] } ) ;
		
		statsP.stack( mods ) ;
		expect( stats.stats.dexterity.base ).to.be( 10 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 12 ) ;

		statsP.stack( mods2 ) ;
		expect( stats.stats.dexterity.base ).to.be( 10 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 15 ) ;

		statsP.stack( mods3 ) ;
		expect( stats.stats.dexterity.base ).to.be( 10 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 19 ) ;
	} ) ;

	it( "power (^ or **) operator" , () => {
		var stats = new lib.StatsTable( { dexterity: 10 } ) ;
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.dexterity.base ).to.be( 10 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;

		var mods = new lib.ModifiersTable( 'agility-ring' , { dexterity: [ '^' , 2 ] } ) ;
		var mods2 = new lib.ModifiersTable( 'agility-ring2' , { dexterity: [ '**' , 3 ] } ) ;
		
		statsP.stack( mods ) ;
		expect( stats.stats.dexterity.base ).to.be( 10 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 100 ) ;

		statsP.stack( mods2 ) ;
		expect( stats.stats.dexterity.base ).to.be( 10 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 1000000 ) ;
	} ) ;

	it( "append (+>) operator" , () => {
		var stats = new lib.StatsTable( { text: "some" } ) ;
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.text.base ).to.be( "some" ) ;
		expect( stats.stats.text.getActual() ).to.be( "some" ) ;

		var mods = new lib.ModifiersTable( 'mods' , { text: [ '+>' , 'text' ] } ) ;
		var mods2 = new lib.ModifiersTable( 'mods2' , { text: [ '+>' , 'again' ] } ) ;
		
		statsP.stack( mods ) ;
		expect( stats.stats.text.base ).to.be( "some" ) ;
		expect( stats.stats.text.getActual() ).to.be( "some text" ) ;

		statsP.stack( mods2 ) ;
		expect( stats.stats.text.base ).to.be( "some" ) ;
		expect( stats.stats.text.getActual() ).to.be( "some text again" ) ;
	} ) ;

	it( "prepend (<+) operator" , () => {
		var stats = new lib.StatsTable( { text: "some" } ) ;
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.text.base ).to.be( "some" ) ;
		expect( stats.stats.text.getActual() ).to.be( "some" ) ;

		var mods = new lib.ModifiersTable( 'mods' , { text: [ '<+' , 'text' ] } ) ;
		var mods2 = new lib.ModifiersTable( 'mods2' , { text: [ '<+' , 'again' ] } ) ;
		
		statsP.stack( mods ) ;
		expect( stats.stats.text.base ).to.be( "some" ) ;
		expect( stats.stats.text.getActual() ).to.be( "text some" ) ;

		statsP.stack( mods2 ) ;
		expect( stats.stats.text.base ).to.be( "some" ) ;
		expect( stats.stats.text.getActual() ).to.be( "again text some" ) ;
	} ) ;
} ) ;



describe( "Misc" , () => {

	it( ".createCloneId()" , () => {
		lib.unitTestResetCloneId() ;
		expect( lib.createCloneId( 'bob' ) ).to.be( 'bob_clone_0' ) ;
		expect( lib.createCloneId( 'bob' ) ).to.be( 'bob_clone_1' ) ;
		expect( lib.createCloneId( 'bob_clone_1' ) ).to.be( 'bob_clone_2' ) ;
		expect( lib.createCloneId( 'bob_clone_1' ) ).to.be( 'bob_clone_3' ) ;
		expect( lib.createCloneId( 'bob_clonE_1' ) ).to.be( 'bob_clonE_1_clone_4' ) ;
	} ) ;
} ) ;

