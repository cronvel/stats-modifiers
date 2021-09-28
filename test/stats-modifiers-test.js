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

		expect( stats.stats.strength[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.stats.strength.pathKey ).to.be( 'strength' ) ;
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

		expect( stats.stats.hp.max[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.stats.hp.max.pathKey ).to.be( 'hp.max' ) ;
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

		expect( stats.stats.hp.max[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.stats.hp.max.pathKey ).to.be( 'hp.max' ) ;
		expect( statsClone.stats.hp.max[ lib.SYMBOL_PARENT ] ).to.be( statsClone ) ;
		expect( statsClone.stats.hp.max.pathKey ).to.be( 'hp.max' ) ;
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
			strength: { __prototypeUID__: 'kung-fig/Operator' , operator: '+' , operand: 5 } ,
			dexterity: [
				{ __prototypeUID__: 'kung-fig/Operator' , operator: '-' , operand: 2 } ,
				{ __prototypeUID__: 'kung-fig/Operator' , operator: '*' , operand: 0.8 }
			] ,
			"hp.max": { __prototypeUID__: 'kung-fig/Operator' , operator: '+' , operand: 2 }
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
	
	it( "ModifiersTable creation with unflatten object structure" , () => {
		var mods = new lib.ModifiersTable( 'staff' , {
			hp: {
				max: { __prototypeUID__: 'kung-fig/Operator' , operator: '+' , operand: 2 } ,
				remaining: { __prototypeUID__: 'kung-fig/Operator' , operator: '/' , operand: 2 }
			}
		} ) ;
		
		var modsP = mods.getProxy() ;
		
		expect( modsP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 2 } } ) ;
		expect( modsP['hp.remaining'] ).to.be.partially.like( { multiply: { id: 'staff' , operator: 'multiply' , operand: 0.5 } } ) ;
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
			hp: {
				remaining: [ '+' , 1 ]
			}
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
			hp: {
				max: [ '+' , 1 ]
			}
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



describe( "zzz Wildcard stats" , () => {

	it( "StatsTable with wildcard stats creation" , () => {
		var stats = new lib.StatsTable( {
			damages: {
				blunt: { damage: 10 } ,
				"*": { damage: 0 }
			}
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.damages.blunt.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.blunt.damage.base ).to.be( 10 ) ;

		expect( stats.stats.damages['*'].damage.base ).to.be( 0 ) ;
		expect( statsP.damages['*'].damage.base ).to.be( 0 ) ;

		expect( stats.stats.damages.blunt.damage[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.stats.damages.blunt.damage.pathKey ).to.be( 'damages.blunt.damage' ) ;
	} ) ;

	it( "xxx Adding/removing a ModifiersTable to a StatsTable" , () => {
		var stats = new lib.StatsTable( {
			damages: {
				blunt: { damage: 10 } ,
				"*": { damage: 0 }
			}
		} ) ;
		
		var statsP = stats.getProxy() ;

		expect( statsP.damages.base ).to.be.a( Set ) ;
		expect( statsP.damages.base ).to.only.contain( 'blunt' ) ;
		expect( statsP.damages.blunt.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.blunt.damage.actual ).to.be( 10 ) ;
		expect( statsP.damages.fire ).to.be( undefined ) ;
		
		var mods = new lib.ModifiersTable( 'fire-brand' , {
			"damages": [ '#' , 'fire' ] ,		// Add a fire type to the wild-card
			"damages.fire.damage": [ '+' , 5 ]
		} ) ;
		
		statsP.stack( mods ) ;

		expect( statsP.damages.base ).to.be.a( Set ) ;
		expect( statsP.damages.base ).to.only.contain( 'blunt' ) ;
		expect( statsP.damages.actual ).to.be.a( Set ) ;
		expect( statsP.damages.actual ).to.only.contain( 'blunt' , 'fire' ) ;
		expect( statsP.damages.blunt.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.blunt.damage.actual ).to.be( 10 ) ;
		console.log( "\n\n\n=================\n" ) ;
		expect( statsP.damages.fire.damage.base ).to.be( 0 ) ;
		console.log( "\n\n\n=================\n" ) ;return ;
		
		expect( statsP.damages.fire.damage.actual ).to.be( 5 ) ;

		return ;
		



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
			hp: {
				remaining: [ '+' , 1 ]
			}
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

		expect( stats.stats.hp.remaining[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.stats.hp.remaining.pathKey ).to.be( 'hp.remaining' ) ;
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
			quickness: Expression.parse( "$reflex" ) ,	// check for old bug when a Ref is returned
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
		expect( statsP.quickness.base ).to.be( 16 ) ;
		expect( statsP.quickness.actual ).to.be( 16 ) ;
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

		var mods3 = new lib.ModifiersTable( 'ring-of-reflex' , { reflex: [ '+' , 3 ] } ) ;
		var mods4 = new lib.ModifiersTable( 'ring-of-quickness' , { quickness: [ '+' , 1 ] } ) ;

		statsP.stack( mods3 ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 19 ) ;
		expect( statsP.quickness.base ).to.be( 16 ) ;
		expect( statsP.quickness.actual ).to.be( 19 ) ;

		statsP.stack( mods4 ) ;
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 19 ) ;
		expect( statsP.quickness.base ).to.be( 16 ) ;
		expect( statsP.quickness.actual ).to.be( 20 ) ;
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

	it( "Gauge stats creation and adding entries to it" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 1 , min: 0 , max: 1 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be( 1 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 1 ) ;
		expect( statsP.hp.maxEntries ).to.be( Infinity ) ;
		expect( statsP.hp['max-entries'] ).to.be( Infinity ) ;
		
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

		expect( stats.stats.hp[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.stats.hp.pathKey ).to.be( 'hp' ) ;
	} ) ;
	
	it( "Gauge stats and recover" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 1 , min: 0 , max: 1 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be( 1 ) ;
		
		statsP.hp.add( -0.2 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.8 ) ;
		expect( statsP.hp.entries ).to.be.like.around( [
			{ value: -0.2 , weight: 1 , description: null }
		] ) ;

		statsP.hp.recover( 0.1 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.9 ) ;
		expect( statsP.hp.entries ).to.be.like.around( [
			{ value: -0.1 , weight: 1 , description: null }
		] ) ;

		statsP.hp.recover( 0.1 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 1 ) ;
		expect( statsP.hp.entries ).to.be.like( [] ) ;
		
		statsP.hp.add( -0.2 , 2 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.8 ) ;
		expect( statsP.hp.entries ).to.be.like.around( [
			{ value: -0.2 , weight: 2 , description: null }
		] ) ;

		statsP.hp.recover( 0.1 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.85 ) ;
		expect( statsP.hp.entries ).to.be.like.around( [
			{ value: -0.15 , weight: 2 , description: null }
		] ) ;

		statsP.hp.recover( 0.1 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.9 ) ;
		expect( statsP.hp.entries ).to.be.like.around( [
			{ value: -0.1 , weight: 2 , description: null }
		] ) ;

		statsP.hp.recover( 0.3 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 1 ) ;
		expect( statsP.hp.entries ).to.be.like.around( [] ) ;
	} ) ;
	
	it( "Gauge stats and recover across multiple entries" , () => {
		var stats , statsP ;

		// We use integer values to avoid rounding errors
		stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 100 , min: 0 , max: 100 } )
		} ) ;
		
		statsP = stats.getProxy() ;
		
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 100 ) ;
		
		statsP.hp.add( -10 , 1 , "injury A" ) ;
		statsP.hp.add( -20 , 1 , "injury B" ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 70 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -10 , weight: 1 , description: "injury A" } ,
			{ value: -20 , weight: 1 , description: "injury B" }
		] ) ;

		statsP.hp.recover( 20 ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 90 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -10 , weight: 1 , description: "injury B" }
		] ) ;

		stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 100 , min: 0 , max: 100 } )
		} ) ;
		
		statsP = stats.getProxy() ;
		
		statsP.hp.add( -4 , 1 , "injury A" ) ;
		statsP.hp.add( -10 , 1 , "injury B" ) ;
		statsP.hp.add( -6 , 1 , "injury C" ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 80 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -4 , weight: 1 , description: "injury A" } ,
			{ value: -10 , weight: 1 , description: "injury B" } ,
			{ value: -6 , weight: 1 , description: "injury C" }
		] ) ;

		statsP.hp.recover( 18 ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 98 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -2 , weight: 1 , description: "injury C" }
		] ) ;
	} ) ;
	
	it( "Gauge stats and recover across multiple entries with different weight" , () => {
		var stats , statsP ;

		stats = new lib.StatsTable( { hp: new lib.Gauge( { base: 100 , min: 0 , max: 100 } ) } ) ;
		statsP = stats.getProxy() ;
		statsP.hp.add( -4 , 0.5 , "injury A" ) ;
		statsP.hp.add( -10 , 2 , "injury B" ) ;
		statsP.hp.add( -6 , 1 , "injury C" ) ;
		statsP.hp.recover( 1.5 ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 83 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -1 , weight: 0.5 , description: "injury A" } ,
			{ value: -10 , weight: 2 , description: "injury B" } ,
			{ value: -6 , weight: 1 , description: "injury C" }
		] ) ;

		stats = new lib.StatsTable( { hp: new lib.Gauge( { base: 100 , min: 0 , max: 100 } ) } ) ;
		statsP = stats.getProxy() ;
		statsP.hp.add( -4 , 0.5 , "injury A" ) ;
		statsP.hp.add( -10 , 2 , "injury B" ) ;
		statsP.hp.add( -6 , 1 , "injury C" ) ;
		statsP.hp.recover( 6 ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 88 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -10 , weight: 2 , description: "injury B" } ,
			{ value: -2 , weight: 1 , description: "injury C" }
		] ) ;

		stats = new lib.StatsTable( { hp: new lib.Gauge( { base: 100 , min: 0 , max: 100 } ) } ) ;
		statsP = stats.getProxy() ;
		statsP.hp.add( -4 , 0.5 , "injury A" ) ;
		statsP.hp.add( -10 , 2 , "injury B" ) ;
		statsP.hp.add( -6 , 1 , "injury C" ) ;
		statsP.hp.recover( 18 ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 95 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -5 , weight: 2 , description: "injury B" }
		] ) ;
	} ) ;
	
	it( "add/merge entries to a Gauge" , () => {
		var stats , statsP ;

		stats = new lib.StatsTable( { hp: new lib.Gauge( { base: 100 , min: 0 , max: 100 } ) } ) ;
		statsP = stats.getProxy() ;
		statsP.hp.addMerge( -4 , 1 , "hit" ) ;
		statsP.hp.addMerge( -10 , 1 , "bleed" ) ;
		statsP.hp.addMerge( -6 , 2 , "bleed" ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 80 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -4 , weight: 1 , description: "hit" } ,
			{ value: -10 , weight: 1 , description: "bleed" } ,
			{ value: -6 , weight: 2 , description: "bleed" }
		] ) ;

		statsP.hp.addMerge( -2 , 1 , "bleed" ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 78 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -4 , weight: 1 , description: "hit" } ,
			{ value: -12 , weight: 1 , description: "bleed" } ,
			{ value: -6 , weight: 2 , description: "bleed" }
		] ) ;

		statsP.hp.addMerge( -8 , 2 , "bleed" ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 70 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: -4 , weight: 1 , description: "hit" } ,
			{ value: -12 , weight: 1 , description: "bleed" } ,
			{ value: -14 , weight: 2 , description: "bleed" }
		] ) ;
	} ) ;
	
	it( "Gauge stats clone" , () => {
		var stats , statsClone , statsP , statsCloneP ;
		
		stats = new lib.StatsTable( { hp: new lib.Gauge( { base: 100 , min: 0 , max: 100 } ) } ) ;
		statsClone = stats.clone() ;
		expect( statsClone ).not.to.be( stats ) ;
		expect( statsClone ).to.equal( stats ) ;
		expect( stats.stats.hp ).to.be.a( lib.Gauge ) ;
		expect( statsClone.stats.hp ).to.be.a( lib.Gauge ) ;
		expect( statsClone.stats.hp ).not.to.be( stats.stats.hp ) ;
		expect( statsClone.stats.hp.entries ).not.to.be( stats.stats.hp.entries ) ;

		expect( statsClone.stats.hp.base ).to.be( 100 ) ;

		// Check that they are distinct
		statsClone.stats.hp.base = 110 ;
		expect( stats.stats.hp.base ).to.be( 100 ) ;
		expect( statsClone.stats.hp.base ).to.be( 110 ) ;

		statsClone.stats.hp.add( -15 ) ;
		stats.stats.hp.add( -20 ) ;
		expect( statsClone.stats.hp.getActual() ).to.be( 95 ) ;
		expect( stats.stats.hp.getActual() ).to.be( 80 ) ;
		expect( statsClone.stats.hp.entries ).to.be.like( [ { value: -15 , weight: 1 , description: null } ] ) ;
		expect( stats.stats.hp.entries ).to.be.like( [ { value: -20 , weight: 1 , description: null } ] ) ;
		
		// Historical bugs, when passing a proxy of Gauge/Alignometer/Compound:
		stats = new lib.StatsTable( { hp: new lib.Gauge( { base: 100 , min: 0 , max: 100 } ).getProxy() } ) ;
		statsClone = stats.clone() ;
		expect( stats.stats.hp.getProxy ).to.be.a( 'function' ) ;
		expect( statsClone.stats.hp.getProxy ).to.be.a( 'function' ) ;
		statsP = stats.getProxy() ;
		statsCloneP = statsP.clone() ;
		expect( statsCloneP.hp ).to.be.a( lib.Gauge ) ;
		expect( statsCloneP.hp ).not.to.be( statsP.hp ) ;
		expect( statsCloneP.hp.entries ).not.to.be( statsP.hp.entries ) ;
		expect( statsCloneP.hp.base ).to.be( 100 ) ;
		expect( statsCloneP.hp.actual ).to.be( 100 ) ;

		stats = new lib.StatsTable( { nested: { hp: new lib.Gauge( { base: 100 , min: 0 , max: 100 } ).getProxy() } } ) ;
		statsClone = stats.clone() ;
		expect( stats.stats.nested.hp.getProxy ).to.be.a( 'function' ) ;
		expect( statsClone.stats.nested.hp.getProxy ).to.be.a( 'function' ) ;
		statsP = stats.getProxy() ;
		statsCloneP = statsP.clone() ;
		expect( statsCloneP.nested.hp ).to.be.a( lib.Gauge ) ;
		expect( statsCloneP.nested.hp ).not.to.be( statsP.nested.hp ) ;
		expect( statsCloneP.nested.hp.entries ).not.to.be( statsP.nested.hp.entries ) ;
		expect( statsCloneP.nested.hp.base ).to.be( 100 ) ;
		expect( statsCloneP.nested.hp.actual ).to.be( 100 ) ;
	} ) ;
} ) ;



describe( "Alignometer stats" , () => {

	it( "Alignometer stats creation and adding entries to it" , () => {
		var stats = new lib.StatsTable( {
			goodness: new lib.Alignometer( { base: 0 , min: -100 , max: 100 , minWeight: 20 , maxEntries: 50 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.goodness[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.stats.goodness.pathKey ).to.be( 'goodness' ) ;

		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 0 ) ;
		expect( statsP.goodness.min ).to.be( -100 ) ;
		expect( statsP.goodness.max ).to.be( 100 ) ;
		expect( statsP.goodness.minWeight ).to.be( 20 ) ;
		expect( statsP.goodness['min-weight'] ).to.be( 20 ) ;
		expect( statsP.goodness.maxEntries ).to.be( 50 ) ;
		expect( statsP.goodness['max-entries'] ).to.be( 50 ) ;
		expect( statsP.goodness.instantMaxWeight ).to.be( 50 ) ;
		expect( statsP.goodness['instant-max-weight'] ).to.be( 50 ) ;
		
		// Since minWeight=20, base value has a weight of 15 here
		statsP.goodness.add( 'up' , 100 , 5 , "charity" ) ;
		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 25 ) ;
		expect( statsP.goodness.entries ).to.be.like( [
			{ direction: 1 , value: 100 , weight: 5 , description: "charity" }
		] ) ;

		// Since minWeight=20, base value has a weight of 10 here
		statsP.goodness.downward( -100 , 5 , "brutality" ) ;
		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 0 ) ;
		expect( statsP.goodness.entries ).to.be.like.around( [
			{ direction: 1 , value: 100 , weight: 5 , description: "charity" } ,
			{ direction: -1 , value: -100 , weight: 5 , description: "brutality" }
		] ) ;

		// Since minWeight=20, base value has no more weight here
		// "not so wise" doesn't affect anything ATM, but will act as a “plateau” after 50
		statsP.goodness.downward( 50 , 10 , "not so wise" ) ;
		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 0 ) ;
		expect( statsP.goodness.entries ).to.be.like.around( [
			{ direction: 1 , value: 100 , weight: 5 , description: "charity" } ,
			{ direction: -1 , value: -100 , weight: 5 , description: "brutality" } ,
			{ direction: -1 , value: 50 , weight: 10 , description: "not so wise" }
		] ) ;
		
		// now "not so wise" affect things, and limit "saint's miracle"
		statsP.goodness.upward( 100 , 30 , "saint's miracle" ) ;
		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 70 ) ;
		expect( statsP.goodness.entries ).to.be.like( [
			{ direction: 1 , value: 100 , weight: 5 , description: "charity" } ,
			{ direction: -1 , value: -100 , weight: 5 , description: "brutality" } ,
			{ direction: -1 , value: 50 , weight: 10 , description: "not so wise" } ,
			{ direction: 1 , value: 100 , weight: 30 , description: "saint's miracle" }
		] ) ;

		// if we remove "not so wise" we see that "saint's miracle" has more effects
		statsP.goodness.entries.splice( 2 , 1 ) ;
		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 75 ) ;
		expect( statsP.goodness.entries ).to.be.like( [
			{ direction: 1 , value: 100 , weight: 5 , description: "charity" } ,
			{ direction: -1 , value: -100 , weight: 5 , description: "brutality" } ,
			{ direction: 1 , value: 100 , weight: 30 , description: "saint's miracle" }
		] ) ;

		statsP.goodness.toward( 0 , 10 , "normie" ) ;
		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 60 ) ;
		expect( statsP.goodness.entries ).to.be.like( [
			{ direction: 1 , value: 100 , weight: 5 , description: "charity" } ,
			{ direction: -1 , value: -100 , weight: 5 , description: "brutality" } ,
			{ direction: 1 , value: 100 , weight: 30 , description: "saint's miracle" } ,
			{ direction: 0 , value: 0 , weight: 10 , description: "normie" }
		] ) ;
	} ) ;

	it( "Alignometer stats clone" , () => {
		var stats = new lib.StatsTable( {
			goodness: new lib.Alignometer( { base: 0 , min: -100 , max: 100 , minWeight: 20 , maxEntries: 50 } )
		} ) ;
		
		var statsClone = stats.clone() ;
		expect( statsClone ).not.to.be( stats ) ;
		expect( statsClone ).to.equal( stats ) ;
		expect( stats.stats.goodness ).to.be.a( lib.Alignometer ) ;
		expect( statsClone.stats.goodness ).to.be.a( lib.Alignometer ) ;
		expect( statsClone.stats.goodness ).not.to.be( stats.stats.goodness ) ;
		expect( statsClone.stats.goodness.entries ).not.to.be( stats.stats.goodness.entries ) ;

		expect( statsClone.stats.goodness.base ).to.be( 0 ) ;

		// Check that they are distinct
		statsClone.stats.goodness.base = 50 ;
		expect( stats.stats.goodness.base ).to.be( 0 ) ;
		expect( statsClone.stats.goodness.base ).to.be( 50 ) ;

		statsClone.stats.goodness.toward( 20 , 10 ) ;
		stats.stats.goodness.toward( -20 , 10 ) ;
		expect( statsClone.stats.goodness.getActual() ).to.be( 35 ) ;
		expect( stats.stats.goodness.getActual() ).to.be( -10 ) ;
		expect( statsClone.stats.goodness.entries ).to.be.like( [ { direction: 0 , value: 20 , weight: 10 , description: null } ] ) ;
		expect( stats.stats.goodness.entries ).to.be.like( [ { direction: 0 , value: -20 , weight: 10 , description: null } ] ) ;
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

