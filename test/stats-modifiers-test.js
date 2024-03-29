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



describe( "Stats Table instanciation and cloning tests" , () => {

	it( "StatsTable creation and basic proxy features" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: 20
		} ) ;

		//log( "stats: %[5]I" , stats ) ;
		//log( "nested parent: %[5]I" , stats.nestedStats[ lib.SYMBOL_PARENT ] ) ;

		var statsP = stats.getProxy() ;

		expect( stats.nestedStats ).to.be.a( lib.NestedStats ) ;
		expect( stats.nestedStats[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.pathKey ).to.be( '' ) ;

		expect( stats.nestedStats.stats.strength ).to.be.a( lib.Stat ) ;
		expect( stats.nestedStats.stats.strength[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.strength.pathKey ).to.be( 'strength' ) ;
		expect( stats.nestedStats.stats.strength.base ).to.be( 12 ) ;

		expect( statsP.strength ).not.to.be( stats.nestedStats.stats.strength ) ;
		expect( statsP.strength ).to.be( statsP.strength ) ;	// <- check that the proxy is cached
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 12 ) ;
		expect( statsP.strength[ lib.SYMBOL_PATH_KEY ] ).to.be( 'strength' ) ;

		expect( statsP ).to.only.have.own.keys( 'mods' , 'strength' , 'dexterity' , 'hp' ) ;
	} ) ;

	it( "StatsTable with nested stats creation and basic proxy features" , () => {
		var stats = new lib.StatsTable( {
			hp: {
				max: 20 ,
				remaining: 14
			} ,
			damages: {
				cutting: { damage: 24 } ,
				fire: { damage: 8 }
			}
		} ) ;

		var statsP = stats.getProxy() ;


		expect( stats.nestedStats ).to.be.a( lib.NestedStats ) ;
		expect( stats.nestedStats[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.pathKey ).to.be( '' ) ;


		expect( stats.nestedStats.stats.hp ).to.be.a( lib.NestedStats ) ;
		expect( stats.nestedStats.stats.hp[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.hp.pathKey ).to.be( 'hp' ) ;
		expect( statsP.hp ).to.be.a( lib.NestedStats ) ;
		expect( statsP.hp.constructor ).to.be( lib.NestedStats ) ;
		expect( statsP.hp.constructor.name ).to.be( 'NestedStats' ) ;
		expect( statsP.hp ).to.only.have.own.keys( 'max' , 'remaining' ) ;
		expect( statsP.hp ).not.to.be( stats.nestedStats.stats.hp ) ;
		expect( statsP.hp ).to.be( statsP.hp ) ;	// <- check that the proxy is cached
		expect( statsP.hp[ lib.SYMBOL_PATH_KEY ] ).to.be( 'hp' ) ;

		expect( stats.nestedStats.stats.hp.stats.max ).to.be.a( lib.Stat ) ;
		expect( stats.nestedStats.stats.hp.stats.max[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.hp.stats.max.pathKey ).to.be( 'hp.max' ) ;
		expect( stats.nestedStats.stats.hp.stats.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max ).not.to.be( stats.nestedStats.stats.hp.stats.max ) ;
		expect( statsP.hp.max ).to.be( statsP.hp.max ) ;	// <- check that the proxy is cached
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;
		expect( statsP.hp.max[ lib.SYMBOL_PATH_KEY ] ).to.be( 'hp.max' ) ;

		expect( stats.nestedStats.stats.hp.stats.remaining ).to.be.a( lib.Stat ) ;
		expect( stats.nestedStats.stats.hp.stats.remaining[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.hp.stats.remaining.pathKey ).to.be( 'hp.remaining' ) ;
		expect( stats.nestedStats.stats.hp.stats.remaining.base ).to.be( 14 ) ;
		expect( statsP.hp.remaining.base ).to.be( 14 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 14 ) ;
		expect( statsP.hp.remaining[ lib.SYMBOL_PATH_KEY ] ).to.be( 'hp.remaining' ) ;


		expect( stats.nestedStats.stats.damages ).to.be.a( lib.NestedStats ) ;
		expect( stats.nestedStats.stats.damages[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.pathKey ).to.be( 'damages' ) ;
		expect( statsP.damages ).to.only.have.own.keys( 'cutting' , 'fire' ) ;
		expect( statsP.damages[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages' ) ;

		expect( stats.nestedStats.stats.damages.stats.cutting ).to.be.a( lib.NestedStats ) ;
		expect( stats.nestedStats.stats.damages.stats.cutting[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.stats.cutting.pathKey ).to.be( 'damages.cutting' ) ;
		expect( statsP.damages.cutting[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.cutting' ) ;

		expect( stats.nestedStats.stats.damages.stats.cutting.stats.damage ).to.be.a( lib.Stat ) ;
		expect( stats.nestedStats.stats.damages.stats.cutting.stats.damage[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.stats.cutting.stats.damage.pathKey ).to.be( 'damages.cutting.damage' ) ;
		expect( stats.nestedStats.stats.damages.stats.cutting.stats.damage.base ).to.be( 24 ) ;
		expect( statsP.damages.cutting.damage.base ).to.be( 24 ) ;
		expect( statsP.damages.cutting.damage.actual ).to.be( 24 ) ;
		expect( statsP.damages.cutting.damage[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.cutting.damage' ) ;


		expect( stats.nestedStats.stats.damages.stats.fire ).to.be.a( lib.NestedStats ) ;
		expect( stats.nestedStats.stats.damages.stats.fire[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.stats.fire.pathKey ).to.be( 'damages.fire' ) ;
		expect( statsP.damages.fire[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire' ) ;

		expect( stats.nestedStats.stats.damages.stats.fire.stats.damage ).to.be.a( lib.Stat ) ;
		expect( stats.nestedStats.stats.damages.stats.fire.stats.damage[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.stats.fire.stats.damage.pathKey ).to.be( 'damages.fire.damage' ) ;
		expect( stats.nestedStats.stats.damages.stats.fire.stats.damage.base ).to.be( 8 ) ;
		expect( statsP.damages.fire.damage.base ).to.be( 8 ) ;
		expect( statsP.damages.fire.damage.actual ).to.be( 8 ) ;
		expect( statsP.damages.fire.damage[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire.damage' ) ;
	} ) ;

	it( "Should re-attach cleanly when creating Nested Stats explicitly" , () => {
		var stats ;

		stats = new lib.StatsTable( {
			damages: new lib.NestedStats( {
				blunt: { area: 1 , damage: 10 }
			} )
		} ) ;

		expect( stats.nestedStats.stats.damages[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.pathKey ).to.be( 'damages' ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.pathKey ).to.be( 'damages.blunt' ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.pathKey ).to.be( 'damages.blunt.damage' ) ;


		stats = new lib.StatsTable( {
			damages: new lib.NestedStats( {
				blunt: new lib.NestedStats( { area: 1 , damage: 10 } )
			} )
		} ) ;

		expect( stats.nestedStats.stats.damages[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.pathKey ).to.be( 'damages' ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.pathKey ).to.be( 'damages.blunt' ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.pathKey ).to.be( 'damages.blunt.damage' ) ;


		stats = new lib.StatsTable( new lib.NestedStats( {
			damages: new lib.NestedStats( {
				blunt: new lib.NestedStats( { area: 1 , damage: 10 } )
			} )
		} ) ) ;

		expect( stats.nestedStats.stats.damages[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.pathKey ).to.be( 'damages' ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.pathKey ).to.be( 'damages.blunt' ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.pathKey ).to.be( 'damages.blunt.damage' ) ;
	} ) ;

	it( "StatsTable clone" , () => {
		var stats = new lib.StatsTable( {
			hp: {
				max: 20 ,
				remaining: 14
			} ,
			damages: {
				cutting: { damage: 24 } ,
				fire: { damage: 8 }
			}
		} ) ;

		var statsClone = stats.clone() ,
			statsP = stats.getProxy() ,
			statsCloneP = statsClone.getProxy() ;

		expect( statsClone ).to.equal( stats ) ;
		expect( stats.nestedStats.stats.hp.stats.max ).to.be.a( lib.Stat ) ;
		expect( statsClone.nestedStats.stats.hp.stats.max ).to.be.a( lib.Stat ) ;

		expect( statsClone.nestedStats.stats.hp.stats.max.base ).to.be( 20 ) ;
		expect( statsClone.nestedStats.stats.hp.stats.remaining.base ).to.be( 14 ) ;
		expect( statsClone.nestedStats.stats.damages.stats.cutting.stats.damage.base ).to.be( 24 ) ;
		expect( statsClone.nestedStats.stats.damages.stats.fire.stats.damage.base ).to.be( 8 ) ;

		// Check that they are distinct

		expect( statsClone ).not.to.be( stats ) ;
		expect( statsClone.nestedStats ).not.to.be( stats.nestedStats ) ;
		expect( statsClone.nestedStats.stats ).not.to.be( stats.nestedStats.stats ) ;
		expect( statsClone.nestedStats.stats.hp ).not.to.be( stats.nestedStats.stats.hp ) ;
		expect( statsClone.nestedStats.stats.hp.stats.max ).not.to.be( stats.nestedStats.stats.hp.stats.max ) ;

		statsP.hp ; statsCloneP.hp ; statsP.hp.max ; statsCloneP.hp.max ;	// trigger proxy cache
		expect( statsClone.nestedStats.proxy ).not.to.be( stats.nestedStats.proxy ) ;
		expect( statsClone.nestedStats.stats.hp.proxy ).not.to.be( stats.nestedStats.stats.hp.proxy ) ;
		expect( statsClone.nestedStats.stats.hp.stats.max.proxy ).not.to.be( stats.nestedStats.stats.hp.stats.max.proxy ) ;

		expect( stats.nestedStats.stats.hp.stats.max[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.hp.stats.max.pathKey ).to.be( 'hp.max' ) ;
		expect( statsClone.nestedStats.stats.hp.stats.max[ lib.SYMBOL_PARENT ] ).to.be( statsClone ) ;
		expect( statsClone.nestedStats.stats.hp.stats.max.pathKey ).to.be( 'hp.max' ) ;

		statsClone.nestedStats.stats.hp.stats.max.base = 17 ;
		expect( statsClone.nestedStats.stats.hp.stats.max.base ).to.be( 17 ) ;
		expect( stats.nestedStats.stats.hp.stats.max.base ).to.be( 20 ) ;

		stats.nestedStats.stats.hp.stats.max.base = 21 ;
		expect( stats.nestedStats.stats.hp.stats.max.base ).to.be( 21 ) ;
		expect( statsClone.nestedStats.stats.hp.stats.max.base ).to.be( 17 ) ;

		statsCloneP.damages.cutting.damage = 19 ;
		expect( statsCloneP.damages.cutting.damage.base ).to.be( 19 ) ;
		expect( statsP.damages.cutting.damage.base ).to.be( 24 ) ;

		statsP.damages.cutting.damage = 30 ;
		expect( statsCloneP.damages.cutting.damage.base ).to.be( 19 ) ;
		expect( statsP.damages.cutting.damage.base ).to.be( 30 ) ;
	} ) ;

	it( "StatsTable extension" , () => {
		var stats = new lib.StatsTable( {
			useless: 123 ,
			hp: {
				max: 20 ,
				remaining: 14 ,
				useless: 123
			} ,
			damages: {
				cutting: { damage: 24 } ,
				fire: { damage: 8 }
			}
		} ) ;

		var extendedStats = stats.extend( {
			useless: null ,	// it removes it
			strength: 10 ,
			hp: {
				injury: 3 ,
				useless: null	// it removes it
			} ,
			damages: {
				electricity: { damage: 4 }
			}
		} ) ;

		expect( extendedStats.nestedStats.stats.strength.base ).to.be( 10 ) ;
		//log( "extendedStats.nestedStats.stats.hp.stats %[5]I" , extendedStats.nestedStats.stats.hp.stats ) ;
		expect( extendedStats.nestedStats.stats.hp.stats.max.base ).to.be( 20 ) ;
		expect( extendedStats.nestedStats.stats.hp.stats.remaining.base ).to.be( 14 ) ;
		expect( extendedStats.nestedStats.stats.hp.stats.injury.base ).to.be( 3 ) ;
		expect( extendedStats.nestedStats.stats.damages.stats ).to.only.have.own.keys( 'cutting' , 'fire' , 'electricity' ) ;
		expect( extendedStats.nestedStats.stats.damages.stats.cutting.stats.damage.base ).to.be( 24 ) ;
		expect( extendedStats.nestedStats.stats.damages.stats.fire.stats.damage.base ).to.be( 8 ) ;
		expect( extendedStats.nestedStats.stats.damages.stats.electricity.stats.damage.base ).to.be( 4 ) ;

		// Check stat removal
		expect( stats.nestedStats.stats.useless.base ).to.be( 123 ) ;
		expect( extendedStats.nestedStats.stats.useless ).to.be.undefined() ;
		expect( stats.nestedStats.stats.hp.stats.useless.base ).to.be( 123 ) ;
		expect( extendedStats.nestedStats.stats.hp.stats.useless ).to.be.undefined() ;
	} ) ;
} ) ;



describe( "Modifiers Table instanciation and cloning tests" , () => {

	it( "ModifiersTable creation and basic proxy features" , () => {
		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;

		var modsP = mods.getProxy() ;

		expect( mods.statsModifiers.strength ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsP.strength ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsP.strength.plus ).to.be.partially.like( { id: 'staff' , operator: 'plus' , operand: 5 } ) ;

		expect( mods.statsModifiers.dexterity ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: - 2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
		expect( modsP.dexterity ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: - 2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
	} ) ;

	it( "ModifiersTable for nested stats creation and basic proxy features" , () => {
		var mods = new lib.ModifiersTable( 'staff' , {
			"hp.max": [ '+' , 5 ] ,
			"damages.blunt.damage": [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;

		var modsP = mods.getProxy() ;

		expect( mods.statsModifiers['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;

		expect( mods.statsModifiers['damages.blunt.damage'] ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: - 2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
		expect( modsP['damages.blunt.damage'] ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: - 2 } ,
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
			plus: { id: 'staff' , operator: 'plus' , operand: - 2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
		expect( modsP.dexterity ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: - 2 } ,
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
			"damages.blunt.damage": [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;

		var modsP = mods.getProxy() ;
		var modsClone = mods.clone( false ) ;
		var modsCloneP = modsClone.getProxy() ;

		expect( modsClone ).not.to.be( mods ) ;
		expect( modsClone.id ).to.be( mods.id ) ;
		expect( modsClone ).to.equal( mods ) ;
		expect( modsClone.statsModifiers['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsCloneP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff' , operator: 'plus' , operand: 5 } } ) ;

		expect( modsClone.statsModifiers['damages.blunt.damage'] ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: - 2 } ,
			multiply: { id: 'staff' , operator: 'multiply' , operand: 0.8 }
		} ) ;
		expect( modsCloneP['damages.blunt.damage'] ).to.be.partially.like( {
			plus: { id: 'staff' , operator: 'plus' , operand: - 2 } ,
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
			"damages.blunt.damage": [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;

		modsP = mods.getProxy() ;
		modsClone = mods.clone() ;
		modsCloneP = modsClone.getProxy() ;

		expect( modsClone ).not.to.be( mods ) ;
		expect( modsClone.id ).not.to.be( mods.id ) ;
		expect( modsClone ).not.to.equal( mods ) ;
		expect( modsClone.statsModifiers['hp.max'] ).to.be.partially.like( { plus: { id: 'staff_clone_0' , operator: 'plus' , operand: 5 } } ) ;
		expect( modsCloneP['hp.max'] ).to.be.partially.like( { plus: { id: 'staff_clone_0' , operator: 'plus' , operand: 5 } } ) ;

		expect( modsClone.statsModifiers['damages.blunt.damage'] ).to.be.partially.like( {
			plus: { id: 'staff_clone_0' , operator: 'plus' , operand: - 2 } ,
			multiply: { id: 'staff_clone_0' , operator: 'multiply' , operand: 0.8 }
		} ) ;
		expect( modsCloneP['damages.blunt.damage'] ).to.be.partially.like( {
			plus: { id: 'staff_clone_0' , operator: 'plus' , operand: - 2 } ,
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
} ) ;



describe( "Attaching Modifiers Tables to Stats Tables" , () => {

	it( "Adding/removing a ModifiersTable to a StatsTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 17 ,
			hp: {
				max: 20 ,
				remaining: 14
			}
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 12 ) ;
		expect( statsP.dexterity.base ).to.be( 17 ) ;
		expect( statsP.dexterity.actual ).to.be( 17 ) ;

		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ] ,
			"hp.max": [ '+' , 2 ]
		} ) ;


		statsP.stack( mods ) ;

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;


		statsP.unstack( mods ) ;

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 12 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;


		var mods2 = new lib.ModifiersTable( 'ring-of-strength' , {
			strength: [ '+' , 2 ] ,
			hp: {
				remaining: [ '+' , 1 ]
			}
		} ) ;

		stats.stack( mods ) ;
		stats.stack( mods2 ) ;

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 19 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;
		expect( statsP.hp.remaining.base ).to.be( 14 ) ;
		expect( statsP.hp.remaining.actual ).to.be( 15 ) ;
	} ) ;

	it( "Should prevent multiple stacking of the same ModifiersTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 17 ,
			hp: {
				max: 20 ,
				remaining: 14
			}
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 12 ) ;
		expect( statsP.dexterity.base ).to.be( 17 ) ;
		expect( statsP.dexterity.actual ).to.be( 17 ) ;

		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ] ,
			"hp.max": [ '+' , 2 ]
		} ) ;


		stats.stack( mods ) ;

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( statsP.dexterity.base ).to.be( 17 ) ;
		expect( statsP.dexterity.actual ).to.be( 12 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;


		stats.stack( mods ) ;

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( statsP.dexterity.base ).to.be( 17 ) ;
		expect( statsP.dexterity.actual ).to.be( 12 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;


		stats.stack( mods ) ;
		stats.stack( mods ) ;
		stats.stack( mods ) ;

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( statsP.dexterity.base ).to.be( 17 ) ;
		expect( statsP.dexterity.actual ).to.be( 12 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;
	} ) ;

	it( "Updating base value of a StatsTable having a ModifiersTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 17 ,
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

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( statsP.dexterity.base ).to.be( 17 ) ;
		expect( statsP.dexterity.actual ).to.be( 12 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;

		// Modify a stat using direct stat access
		stats.nestedStats.stats.strength.set( 10 ) ;

		expect( statsP.strength.base ).to.be( 10 ) ;
		expect( statsP.strength.actual ).to.be( 15 ) ;

		// Modify a stat through proxy
		statsP.strength = 8 ;

		expect( statsP.strength.base ).to.be( 8 ) ;
		expect( statsP.strength.actual ).to.be( 13 ) ;

		statsP.strength.base = 6 ;

		expect( statsP.strength.base ).to.be( 6 ) ;
		expect( statsP.strength.actual ).to.be( 11 ) ;

		statsP.hp.max.base = 26 ;

		expect( statsP.hp.max.base ).to.be( 26 ) ;
		expect( statsP.hp.max.actual ).to.be( 28 ) ;
	} ) ;

	it( "Updating a ModifiersTable already stacked on a StatsTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 17 ,
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

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( statsP.dexterity.base ).to.be( 17 ) ;
		expect( statsP.dexterity.actual ).to.be( 12 ) ;
		expect( statsP.hp.max.base ).to.be( 20 ) ;
		expect( statsP.hp.max.actual ).to.be( 22 ) ;

		mods.statsModifiers.strength.plus.set( 7 ) ;

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 19 ) ;

		// Modify a stat modifier using direct modifier access
		modsP.strength.plus = 4 ;

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 16 ) ;

		modsP.strength.multiply = 2 ;

		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 32 ) ;

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
			plus: { id: 'staff' , operator: 'plus' , operand: - 2 } ,
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

		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;

		mods2.activate() ;
		expect( statsP.dexterity.actual ).to.be( 18 ) ;
		expect( statsP.hp.max.actual ).to.be( 20 ) ;

		mods.deactivate() ;
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



describe( "Traits" , () => {

	it( "StatsTable with explicit Traits stats creation" , () => {
		var stats = new lib.StatsTable( {
			traits: new lib.Traits( [ 'living' , 'hero' ] )
		} ) ;

		var statsP = stats.getProxy() ;

		//log( "Stats: %[5]I" , stats ) ;
		expect( stats.nestedStats.stats.traits ).to.be.a( lib.Traits ) ;
		expect( stats.nestedStats.stats.traits.base ).to.be.an( Object ) ;
		expect( stats.nestedStats.stats.traits.base ).to.only.have.own.keys( 'living' , 'hero' ) ;

		//log( "Stats traits: %[5]I" , stats.nestedStats.stats.traits ) ;
		//log( "Stats traits: %[5]I" , statsP.traits ) ;
		expect( statsP.traits ).to.be.a( lib.Traits ) ;
		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.unexistant ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( true ) ;
		expect( statsP.traits.actual.hero ).to.be( true ) ;
		expect( statsP.traits.actual.unexistant ).to.be( false ) ;
		expect( Object.keys( statsP.traits.actual ) ).to.only.contain( 'living' , 'hero' ) ;
	} ) ;

	it( "StatsTable with implicit Traits stats creation (Set)" , () => {
		var stats = new lib.StatsTable( {
			traits: new Set( [ 'living' , 'hero' ] )
		} ) ;

		var statsP = stats.getProxy() ;

		//log( "Stats: %[5]I" , stats ) ;
		expect( stats.nestedStats.stats.traits ).to.be.a( lib.Traits ) ;
		expect( stats.nestedStats.stats.traits.base ).to.be.an( Object ) ;
		expect( stats.nestedStats.stats.traits.base ).to.only.have.own.keys( 'living' , 'hero' ) ;

		expect( statsP.traits ).to.be.a( lib.Traits ) ;
		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.unexistant ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( true ) ;
		expect( statsP.traits.actual.hero ).to.be( true ) ;
		expect( statsP.traits.actual.unexistant ).to.be( false ) ;
		expect( Object.keys( statsP.traits.actual ) ).to.only.contain( 'living' , 'hero' ) ;
	} ) ;

	it( "Traits stat with Modifiers featuring the add/remove operator" , () => {
		var stats = new lib.StatsTable( {
			traits: new lib.Traits( [ 'living' , 'hero' ] )
		} ) ;

		var statsP = stats.getProxy() ;

		var mods = new lib.ModifiersTable( 'initiative-ring' , {
			"traits.firstStrike": [ '#' , true ]
		} ) ;

		var modsP = mods.getProxy() ;

		var mods2 = new lib.ModifiersTable( 'undead-ring' , {
			"traits.firstStrike": [ '#' , false ] ,
			"traits.living": [ '#' , false ]
		} ) ;

		var mods2P = mods2.getProxy() ;

		expect( stats.checkModifiablePath( "traits" ) ).to.be( true ) ;
		expect( stats.checkModifiablePath( "traits.firstStrike" ) ).to.be( true ) ;

		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( true ) ;
		expect( statsP.traits.actual.hero ).to.be( true ) ;
		expect( statsP.traits.actual.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.actual ) ).to.only.contain( 'living' , 'hero' ) ;

		//console.error( "\n\n++++++++++" ) ;
		statsP.stack( modsP ) ;
		//console.error( "++++++++++" ) ;
		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( true ) ;
		expect( statsP.traits.actual.hero ).to.be( true ) ;
		//console.error( "----------" ) ;
		expect( statsP.traits.actual.firstStrike ).to.be( true ) ;
		expect( Object.keys( statsP.traits.actual ) ).to.only.contain( 'living' , 'hero' , 'firstStrike' ) ;

		statsP.unstack( modsP ) ;
		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( true ) ;
		expect( statsP.traits.actual.hero ).to.be( true ) ;
		expect( statsP.traits.actual.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.actual ) ).to.only.contain( 'living' , 'hero' ) ;

		statsP.stack( modsP ) ;
		statsP.stack( mods2P ) ;
		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( false ) ;
		expect( statsP.traits.actual.hero ).to.be( true ) ;
		expect( statsP.traits.actual.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.actual ) ).to.only.contain( 'hero' ) ;

		/*
		// Stacking them in reverse order: removing tags must always have precedence to have consistent results...
		statsP.unstack( modsP ) ;
		statsP.unstack( mods2P ) ;
		statsP.stack( mods2P ) ;
		statsP.stack( modsP ) ;
		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( false ) ;
		expect( statsP.traits.actual.hero ).to.be( true ) ;
		expect( statsP.traits.actual.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.actual ) ).to.only.contain( 'hero' ) ;
		*/
	} ) ;
} ) ;



describe( "Wild Nested Stats" , () => {

	it( "WildNestedStats creation and proxy features" , () => {
		var stats = new lib.StatsTable( {
			damages: new lib.WildNestedStats( {
				_: { area: 1 , damage: 0 } ,
				blunt: { area: 1 , damage: 10 } ,
				fire: { area: 2 , damage: 4 }
			} )
		} ) ;

		var statsP = stats.getProxy() ;
		//log( "statsP.damages: %[5l50000s5000]I" , statsP.damages ) ;

		expect( statsP.damages[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages' ) ;
		expect( statsP.damages.fire[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire' ) ;
		expect( statsP.damages.blunt[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.blunt' ) ;
		expect( statsP.damages.fire.damage[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire.damage' ) ;
		expect( statsP.damages.base.fire[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire' ) ;
		expect( statsP.damages.base.fire.damage[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire.damage' ) ;
		expect( statsP.damages.actual.fire[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire' ) ;
		expect( statsP.damages.actual.fire.damage[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire.damage' ) ;
		expect( statsP.damages.template.damage[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.template.damage' ) ;

		expect( statsP.damages ).to.be.a( lib.WildNestedStats ) ;
		expect( statsP.damages.constructor ).to.be( lib.WildNestedStats ) ;
		expect( statsP.damages.constructor.name ).to.be( 'WildNestedStats' ) ;

		expect( statsP.damages ).to.only.have.own.keys( 'template' , 'blunt' , 'fire' ) ;
		expect( stats.nestedStats.stats.damages.template.stats.damage.base ).to.be( 0 ) ;
		expect( statsP.damages.template.damage.base ).to.be( 0 ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.blunt.damage.base ).to.be( 10 ) ;
		expect( stats.nestedStats.stats.damages.stats.fire.stats.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.base ).to.only.have.own.keys( 'blunt' , 'fire' ) ;
		expect( statsP.damages.base.blunt.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.base.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.actual ).to.only.have.own.keys( 'blunt' , 'fire' ) ;
		expect( statsP.damages.actual.blunt.damage.base ).to.be( 10 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.blunt.damage.actual ).to.be( 10 ) ;
		expect( statsP.damages.actual.fire.damage.base ).to.be( 4 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.fire.damage.actual ).to.be( 4 ) ;

		// Check re-attachment for stats
		expect( stats.nestedStats.stats.damages[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.pathKey ).to.be( 'damages' ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.pathKey ).to.be( 'damages.blunt' ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.pathKey ).to.be( 'damages.blunt.damage' ) ;

		// Check re-attachment for template stats
		expect( stats.nestedStats.stats.damages.template[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.template.pathKey ).to.be( 'damages.template' ) ;
		expect( stats.nestedStats.stats.damages.template.stats.damage[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.damages.template.stats.damage.pathKey ).to.be( 'damages.template.damage' ) ;
	} ) ;

	it( "WildNestedStats cloning historical bug" , () => {
		var stats = new lib.StatsTable( {
			damages: new lib.WildNestedStats( {
				_: { area: 1 , damage: 0 } ,
				blunt: { area: 1 , damage: 10 } ,
				fire: { area: 2 , damage: 4 }
			} )
		} ) ;

		var statsP = stats.getProxy() ;
		var statsClone = stats.clone() ;
		var statsCloneP = statsClone.getProxy() ;
		/*
		log( "source: %[5l50000s5000]I" , stats.nestedStats.stats.damages ) ;
		log( "source->proxy: %[5l50000s5000]I" , stats.nestedStats.stats.damages.getProxy() ) ;
		log( "source->clone: %[5l50000s5000]I" , stats.nestedStats.stats.damages.clone() ) ;
		log( "source->clone->proxy: %[5l50000s5000]I" , statsCloneP.damages ) ;
		*/
		expect( statsCloneP.damages.template ).to.be.truthy() ;
		expect( statsCloneP.damages.template.damage.base ).to.be( 0 ) ;
		expect( statsCloneP.damages.template.area.base ).to.be( 1 ) ;

		// Check re-attachment for statsClone
		expect( statsClone.nestedStats.stats.damages[ lib.SYMBOL_PARENT ] ).to.be( statsClone ) ;
		expect( statsClone.nestedStats.stats.damages.pathKey ).to.be( 'damages' ) ;
		expect( statsClone.nestedStats.stats.damages.stats.blunt[ lib.SYMBOL_PARENT ] ).to.be( statsClone ) ;
		expect( statsClone.nestedStats.stats.damages.stats.blunt.pathKey ).to.be( 'damages.blunt' ) ;
		expect( statsClone.nestedStats.stats.damages.stats.blunt.stats.damage[ lib.SYMBOL_PARENT ] ).to.be( statsClone ) ;
		expect( statsClone.nestedStats.stats.damages.stats.blunt.stats.damage.pathKey ).to.be( 'damages.blunt.damage' ) ;

		// Check re-attachment for template statsClone
		expect( statsClone.nestedStats.stats.damages.template[ lib.SYMBOL_PARENT ] ).to.be( statsClone ) ;
		expect( statsClone.nestedStats.stats.damages.template.pathKey ).to.be( 'damages.template' ) ;
		expect( statsClone.nestedStats.stats.damages.template.stats.damage[ lib.SYMBOL_PARENT ] ).to.be( statsClone ) ;
		expect( statsClone.nestedStats.stats.damages.template.stats.damage.pathKey ).to.be( 'damages.template.damage' ) ;
	} ) ;

	it( "Adding/removing a ModifiersTable to a StatsTable having WildNestedStats" , () => {
		var stats = new lib.StatsTable( {
			damages: new lib.WildNestedStats( {
				_: { area: 1 , damage: 0 } ,
				blunt: { area: 1 , damage: 10 } ,
				fire: { area: 2 , damage: 4 }
			} )
		} ) ;

		var statsP = stats.getProxy() ;

		var mods = new lib.ModifiersTable( 'ring-of-lightning' , {
			"damages.lightning": [ '#' , true ] ,		// Add an lightning type to the wild nested stats
			"damages.lightning.damage": [ '+' , 5 ]
		} ) ;

		statsP.stack( mods ) ;

		expect( statsP.damages ).to.only.have.own.keys( 'template' , 'blunt' , 'fire' ) ;
		expect( stats.nestedStats.stats.damages.template.stats.damage.base ).to.be( 0 ) ;
		expect( statsP.damages.template.damage.base ).to.be( 0 ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.blunt.damage.base ).to.be( 10 ) ;
		expect( stats.nestedStats.stats.damages.stats.fire.stats.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.base ).to.only.have.own.keys( 'blunt' , 'fire' ) ;
		expect( statsP.damages.base.blunt.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.base.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.actual ).to.only.have.own.keys( 'blunt' , 'fire' , 'lightning' ) ;
		expect( statsP.damages.actual.blunt.damage.base ).to.be( 10 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.blunt.damage.actual ).to.be( 10 ) ;
		expect( statsP.damages.actual.fire.damage.base ).to.be( 4 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.fire.damage.actual ).to.be( 4 ) ;
		expect( statsP.damages.actual.lightning.damage.base ).to.be( 0 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.lightning.damage.actual ).to.be( 5 ) ;

		statsP.unstack( mods ) ;

		expect( statsP.damages ).to.only.have.own.keys( 'template' , 'blunt' , 'fire' ) ;
		expect( stats.nestedStats.stats.damages.template.stats.damage.base ).to.be( 0 ) ;
		expect( statsP.damages.template.damage.base ).to.be( 0 ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.blunt.damage.base ).to.be( 10 ) ;
		expect( stats.nestedStats.stats.damages.stats.fire.stats.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.base ).to.only.have.own.keys( 'blunt' , 'fire' ) ;
		expect( statsP.damages.base.blunt.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.base.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.actual ).to.only.have.own.keys( 'blunt' , 'fire' ) ;
		expect( statsP.damages.actual.blunt.damage.base ).to.be( 10 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.blunt.damage.actual ).to.be( 10 ) ;
		expect( statsP.damages.actual.fire.damage.base ).to.be( 4 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.fire.damage.actual ).to.be( 4 ) ;

		var mods2 = new lib.ModifiersTable( 'ring-of-fire-and-storm' , {
			"damages.fire": [ '#' , true ] ,
			"damages.fire.damage": [ '+' , 3 ] ,
			"damages.lightning": [ '#' , true ] ,
			"damages.lightning.damage": [ '+' , 3 ]
		} ) ;

		stats.stack( mods ) ;
		stats.stack( mods2 ) ;

		expect( statsP.damages ).to.only.have.own.keys( 'template' , 'blunt' , 'fire' ) ;
		expect( stats.nestedStats.stats.damages.template.stats.damage.base ).to.be( 0 ) ;
		expect( statsP.damages.template.damage.base ).to.be( 0 ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.blunt.damage.base ).to.be( 10 ) ;
		expect( stats.nestedStats.stats.damages.stats.fire.stats.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.base ).to.only.have.own.keys( 'blunt' , 'fire' ) ;
		expect( statsP.damages.base.blunt.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.base.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.actual ).to.only.have.own.keys( 'blunt' , 'fire' , 'lightning' ) ;
		expect( statsP.damages.actual.blunt.damage.base ).to.be( 10 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.blunt.damage.actual ).to.be( 10 ) ;
		expect( statsP.damages.actual.fire.damage.base ).to.be( 4 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.fire.damage.actual ).to.be( 7 ) ;
		expect( statsP.damages.actual.lightning.damage.base ).to.be( 0 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.lightning.damage.actual ).to.be( 8 ) ;

		statsP.unstack( mods ) ;
		statsP.unstack( mods2 ) ;

		expect( statsP.damages ).to.only.have.own.keys( 'template' , 'blunt' , 'fire' ) ;
		expect( stats.nestedStats.stats.damages.template.stats.damage.base ).to.be( 0 ) ;
		expect( statsP.damages.template.damage.base ).to.be( 0 ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.blunt.damage.base ).to.be( 10 ) ;
		expect( stats.nestedStats.stats.damages.stats.fire.stats.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.base ).to.only.have.own.keys( 'blunt' , 'fire' ) ;
		expect( statsP.damages.base.blunt.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.base.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.actual ).to.only.have.own.keys( 'blunt' , 'fire' ) ;
		expect( statsP.damages.actual.blunt.damage.base ).to.be( 10 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.blunt.damage.actual ).to.be( 10 ) ;
		expect( statsP.damages.actual.fire.damage.base ).to.be( 4 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.fire.damage.actual ).to.be( 4 ) ;
	} ) ;

	it( "ModifiersTable activate + nested object syntax for WildNestedStats" , () => {
		var stats = new lib.StatsTable( {
			damages: new lib.WildNestedStats( {
				_: { area: 1 , damage: 0 } ,
				blunt: { area: 1 , damage: 10 } ,
				fire: { area: 2 , damage: 4 }
			} )
		} ) ;

		var statsP = stats.getProxy() ;

		var mods = new lib.ModifiersTable( 'ring-of-lightning' , {
			"damages.lightning": [ '#' , {
				damage: [ '+' , 5 ] ,
				area: [ '+' , 6 ]
			} ]
		} ) ;

		statsP.stack( mods ) ;

		expect( statsP.damages ).to.only.have.own.keys( 'template' , 'blunt' , 'fire' ) ;
		expect( stats.nestedStats.stats.damages.template.stats.damage.base ).to.be( 0 ) ;
		expect( statsP.damages.template.damage.base ).to.be( 0 ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.blunt.damage.base ).to.be( 10 ) ;
		expect( stats.nestedStats.stats.damages.stats.fire.stats.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.base ).to.only.have.own.keys( 'blunt' , 'fire' ) ;
		expect( statsP.damages.base.blunt.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.base.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.actual ).to.only.have.own.keys( 'blunt' , 'fire' , 'lightning' ) ;
		expect( statsP.damages.actual.blunt.damage.base ).to.be( 10 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.blunt.damage.actual ).to.be( 10 ) ;
		expect( statsP.damages.actual.fire.damage.base ).to.be( 4 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.fire.damage.actual ).to.be( 4 ) ;
		expect( statsP.damages.actual.lightning.damage.base ).to.be( 0 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.lightning.damage.actual ).to.be( 5 ) ;
		expect( statsP.damages.actual.lightning.area.actual ).to.be( 7 ) ;


		// KFG variant

		stats = new lib.StatsTable( {
			damages: new lib.WildNestedStats( {
				_: { area: 1 , damage: 0 } ,
				blunt: { area: 1 , damage: 10 } ,
				fire: { area: 2 , damage: 4 }
			} )
		} ) ;

		statsP = stats.getProxy() ;

		mods = new lib.ModifiersTable( 'ring-of-lightning' , {
			"damages.lightning": {
				__prototypeUID__: 'kung-fig/Operator' ,
				operator: '#' ,
				operand: {
					damage: [ '+' , 5 ] ,
					area: [ '+' , 6 ]
				}
			}
		} ) ;

		statsP.stack( mods ) ;

		expect( statsP.damages ).to.only.have.own.keys( 'template' , 'blunt' , 'fire' ) ;
		expect( stats.nestedStats.stats.damages.template.stats.damage.base ).to.be( 0 ) ;
		expect( statsP.damages.template.damage.base ).to.be( 0 ) ;
		expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.blunt.damage.base ).to.be( 10 ) ;
		expect( stats.nestedStats.stats.damages.stats.fire.stats.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.base ).to.only.have.own.keys( 'blunt' , 'fire' ) ;
		expect( statsP.damages.base.blunt.damage.base ).to.be( 10 ) ;
		expect( statsP.damages.base.fire.damage.base ).to.be( 4 ) ;
		expect( statsP.damages.actual ).to.only.have.own.keys( 'blunt' , 'fire' , 'lightning' ) ;
		expect( statsP.damages.actual.blunt.damage.base ).to.be( 10 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.blunt.damage.actual ).to.be( 10 ) ;
		expect( statsP.damages.actual.fire.damage.base ).to.be( 4 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.fire.damage.actual ).to.be( 4 ) ;
		expect( statsP.damages.actual.lightning.damage.base ).to.be( 0 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
		expect( statsP.damages.actual.lightning.damage.actual ).to.be( 5 ) ;
		expect( statsP.damages.actual.lightning.area.actual ).to.be( 7 ) ;
	} ) ;

	it( "WildNestedStats .fixAttachment() and .setStat() historical bugs" , () => {
		var wildNestedStats , stats , statsP ;

		var testAllExpectations = () => {
			expect( statsP.damages[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages' ) ;
			expect( statsP.damages.fire[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire' ) ;
			expect( statsP.damages.blunt[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.blunt' ) ;
			expect( statsP.damages.fire.damage[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire.damage' ) ;
			expect( statsP.damages.base.fire[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire' ) ;
			expect( statsP.damages.base.fire.damage[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire.damage' ) ;
			expect( statsP.damages.actual.fire[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire' ) ;
			expect( statsP.damages.actual.fire.damage[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.fire.damage' ) ;
			expect( statsP.damages.template.damage[ lib.SYMBOL_PATH_KEY ] ).to.be( 'damages.template.damage' ) ;

			expect( statsP.damages ).to.only.have.own.keys( 'template' , 'blunt' , 'fire' ) ;
			expect( stats.nestedStats.stats.damages.template.stats.damage.base ).to.be( 0 ) ;
			expect( statsP.damages.template.damage.base ).to.be( 0 ) ;
			expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.base ).to.be( 10 ) ;
			expect( statsP.damages.blunt.damage.base ).to.be( 10 ) ;
			expect( stats.nestedStats.stats.damages.stats.fire.stats.damage.base ).to.be( 4 ) ;
			expect( statsP.damages.fire.damage.base ).to.be( 4 ) ;
			expect( statsP.damages.base ).to.only.have.own.keys( 'blunt' , 'fire' ) ;
			expect( statsP.damages.base.blunt.damage.base ).to.be( 10 ) ;
			expect( statsP.damages.base.fire.damage.base ).to.be( 4 ) ;
			expect( statsP.damages.actual ).to.only.have.own.keys( 'blunt' , 'fire' ) ;
			expect( statsP.damages.actual.blunt.damage.base ).to.be( 10 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
			expect( statsP.damages.actual.blunt.damage.actual ).to.be( 10 ) ;
			expect( statsP.damages.actual.fire.damage.base ).to.be( 4 ) ;	// it makes no sense to mix 'actual' and 'base', but we test it anyway
			expect( statsP.damages.actual.fire.damage.actual ).to.be( 4 ) ;

			// Check re-attachment for stats
			expect( stats.nestedStats.stats.damages[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
			expect( stats.nestedStats.stats.damages.pathKey ).to.be( 'damages' ) ;
			expect( stats.nestedStats.stats.damages.stats.blunt[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
			expect( stats.nestedStats.stats.damages.stats.blunt.pathKey ).to.be( 'damages.blunt' ) ;
			expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
			expect( stats.nestedStats.stats.damages.stats.blunt.stats.damage.pathKey ).to.be( 'damages.blunt.damage' ) ;

			// Check re-attachment for template stats
			expect( stats.nestedStats.stats.damages.template[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
			expect( stats.nestedStats.stats.damages.template.pathKey ).to.be( 'damages.template' ) ;
			expect( stats.nestedStats.stats.damages.template.stats.damage[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
			expect( stats.nestedStats.stats.damages.template.stats.damage.pathKey ).to.be( 'damages.template.damage' ) ;
		} ;

		wildNestedStats = new lib.WildNestedStats( {
			_: { area: 1 , damage: 0 } ,
			blunt: { area: 1 , damage: 10 } ,
			fire: { area: 2 , damage: 4 }
		} ) ;


		// Test 1: .setStat() on a wild nested stats

		stats = new lib.StatsTable( {
			damages: new lib.WildNestedStats( {} )
		} ) ;
		statsP = stats.getProxy() ;
		stats.nestedStats.setStat( 'damages' , wildNestedStats ) ;
		//log( "statsP.damages: %[5l50000s5000]I" , statsP.damages ) ;
		//log( "stats.nestedStats: %[10l50000s5000]I" , stats.nestedStats ) ;
		testAllExpectations() ;


		// Test 2: create with a wild nested stats proxy

		stats = new lib.StatsTable( {
			damages: wildNestedStats.getProxy()
		} ) ;
		statsP = stats.getProxy() ;
		//stats.nestedStats.setStat( 'damages' , wildNestedStats ) ;
		//log( "statsP.damages: %[5l50000s5000]I" , statsP.damages ) ;
		//log( "stats.nestedStats: %[10l50000s5000]I" , stats.nestedStats ) ;
		testAllExpectations() ;


		// Test 3: create with a wild nested stats proxy, then .setStat()

		wildNestedStats = new lib.WildNestedStats( {
			_: { area: 1 , damage: 0 } ,
			blunt: { area: 1 , damage: 10 } ,
			fire: { area: 2 , damage: 4 }
		} ) ;
		stats = new lib.StatsTable( {
			damages: wildNestedStats.getProxy()
		} ) ;
		statsP = stats.getProxy() ;
		//console.error( "\n\n>>>>>>>>>>>>>>>" ) ;
		stats.nestedStats.setStat( 'damages' , wildNestedStats ) ;
		//log( "statsP.damages: %[5l50000s5000]I" , statsP.damages ) ;
		//log( "stats.nestedStats: %[10l50000s5000]I" , stats.nestedStats ) ;
		testAllExpectations() ;
	} ) ;

	it( "Nesting WildNestedStats" ) ;
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
					plus: { id: 'staff_1' , operator: 'plus' , operand: - 2 } ,
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
			dexterity: 10
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
			[ {
				name: 'new-turn' , every: 2 , action: 'fade' , amount: 3
			} ]
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
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;

		var wellMade = new lib.ModifiersTable( 'well-made' , {
			strength: [ '+' , 1 ] ,
			dexterity: [ [ '+' , 1 ] , [ '*' , 1.125 ] ]
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
					plus: { id: 'well-made-staff' , operator: 'plus' , operand: - 1 } ,
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

		expect( stats.nestedStats.stats.hp.stats.remaining[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.hp.stats.remaining.pathKey ).to.be( 'hp.remaining' ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( stats.nestedStats.stats.defense.getBase() ).to.be( 13 ) ;
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
			"hp.max": [ '+' , 1 ]
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
				stats_ => ( 2 * stats_.reflex.base + stats_.dexterity.base ) / 3 ,
				stats_ => ( 2 * stats_.reflex.actual + stats_.dexterity.actual ) / 3
			) ,
			hp: {
				max: 20 ,
				injury: 12 ,
				remaining: new lib.CompoundStat(
					stats_ => stats_.hp.max.base - stats_.hp.injury.base ,
					stats_ => stats_.hp.max.actual - stats_.hp.injury.actual
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
		expect( stats.nestedStats.stats.reflex ).to.be.a( lib.Stat ) ;
		expect( statsClone.nestedStats.stats.reflex ).to.be.a( lib.Stat ) ;
		expect( stats.nestedStats.stats.defense ).to.be.a( lib.CompoundStat ) ;
		expect( statsClone.nestedStats.stats.defense ).to.be.a( lib.CompoundStat ) ;
		expect( statsClone.nestedStats.stats.defense ).not.to.be( stats.nestedStats.stats.defense ) ;

		expect( statsClone.nestedStats.stats.reflex.base ).to.be( 16 ) ;
		expect( statsClone.nestedStats.stats.dexterity.base ).to.be( 10 ) ;
		expect( statsClone.nestedStats.stats.defense.getBase() ).to.be( 13 ) ;

		// Check that they are distinct
		statsClone.nestedStats.stats.reflex.base = 18 ;
		expect( stats.nestedStats.stats.reflex.base ).to.be( 16 ) ;
		expect( statsClone.nestedStats.stats.reflex.base ).to.be( 18 ) ;
		expect( stats.nestedStats.stats.defense.getBase() ).to.be( 13 ) ;
		expect( statsClone.nestedStats.stats.defense.getBase() ).to.be( 14 ) ;
	} ) ;
} ) ;



describe( "Pool Stats" , () => {

	it( "Pool Stats creation" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 } )
		} ) ;

		var statsP = stats.getProxy() ;
		//log( "%[5]Y" , stats.nestedStats ) ;
		//log( "%[5]Y" , statsP ) ;
		//console.log( stats ) ;
		expect( statsP.hp ).to.be.a( lib.Pool ) ;
		expect( statsP.hp.constructor ).to.be( lib.Pool ) ;
		expect( statsP.hp.constructor.name ).to.be( 'Pool' ) ;

		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.actualMax ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( 0 ) ;
	} ) ;

	it( "Adding points to a Pool" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 } )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( 0 ) ;

		expect( statsP.hp.add( - 3 ) ).to.be( - 3 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.used ).to.be( 3 ) ;

		expect( statsP.hp.add( 2 ) ).to.be( 2 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.used ).to.be( 1 ) ;

		expect( statsP.hp.add( 20 ) ).to.be( 1 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( 0 ) ;

		expect( statsP.hp.add( - 50 ) ).to.be( - 50 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.used ).to.be( 50 ) ;
	} ) ;

	it( "Losing points from a Pool" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 } )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 0 ) ;

		expect( statsP.hp.lose( 1 ) ).to.be( 1 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.lost ).to.be( 1 ) ;

		expect( statsP.hp.lose( 2 ) ).to.be( 2 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.lost ).to.be( 3 ) ;

		expect( statsP.hp.lose( 20 ) ).to.be( 20 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.lost ).to.be( 23 ) ;

		expect( statsP.hp.lose( 5 ) ).to.be( 5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.lost ).to.be( 28 ) ;
	} ) ;

	it( "Using points from a Pool" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 } )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( 0 ) ;

		expect( statsP.hp.use( 1 ) ).to.be( true ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.used ).to.be( 1 ) ;

		expect( statsP.hp.use( 2 ) ).to.be( true ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.used ).to.be( 3 ) ;

		expect( statsP.hp.use( 20 ) ).to.be( false ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.used ).to.be( 3 ) ;

		expect( statsP.hp.use( 5 ) ).to.be( true ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.used ).to.be( 8 ) ;
	} ) ;

	it( "Restoring points of a Pool" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 } )
		} ) ;

		var statsP = stats.getProxy() ;

		statsP.hp.empty() ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.used ).to.be( 8 ) ;

		expect( statsP.hp.restore( 1 ) ).to.be( 1 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 1 ) ;
		expect( statsP.hp.used ).to.be( 7 ) ;

		expect( statsP.hp.restore( 3 ) ).to.be( 3 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 4 ) ;
		expect( statsP.hp.used ).to.be( 4 ) ;

		expect( statsP.hp.restore( 20 ) ).to.be( 4 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( 0 ) ;
	} ) ;

	it( "Depleting points from a Pool" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 } )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( 0 ) ;

		expect( statsP.hp.deplete( 1 ) ).to.be( 1 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.used ).to.be( 1 ) ;

		expect( statsP.hp.deplete( 2 ) ).to.be( 2 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.used ).to.be( 3 ) ;

		expect( statsP.hp.deplete( 20 ) ).to.be( 5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.used ).to.be( 8 ) ;

		expect( statsP.hp.deplete( 5 ) ).to.be( 0 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.used ).to.be( 8 ) ;
	} ) ;

	it( "Replenishing the Pool" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 } )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( 0 ) ;

		expect( statsP.hp.lose( 5 ) ).to.be( 5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 3 ) ;
		expect( statsP.hp.used ).to.be( 5 ) ;

		expect( statsP.hp.replenish() ).to.be( 5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( 0 ) ;

		expect( statsP.hp.lose( 20 ) ).to.be( 20 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.used ).to.be( 20 ) ;

		expect( statsP.hp.replenish() ).to.be( 20 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( 0 ) ;
	} ) ;

	it( "Emptying the Pool" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 } )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( 0 ) ;

		expect( statsP.hp.empty() ).to.be( 8 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.used ).to.be( 8 ) ;
	} ) ;

	it( "Pool with rounding mode" , () => {
		var stats , statsP ;

		stats = new lib.StatsTable( { hp: new lib.Pool( { base: 8 } ) } ) ;
		statsP = stats.getProxy() ;

		expect( statsP.hp.lose( 1.5 ) ).to.be( 1.5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 6.5 ) ;
		expect( statsP.hp.lost ).to.be( 1.5 ) ;

		stats = new lib.StatsTable( { hp: new lib.Pool( { base: 8 , actualRound: true } ) } ) ;
		statsP = stats.getProxy() ;

		expect( statsP.hp.lose( 1.5 ) ).to.be( 1.5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.lost ).to.be( 1.5 ) ;

		expect( statsP.hp.lose( 0.25 ) ).to.be( 0.25 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 6 ) ;
		expect( statsP.hp.lost ).to.be( 1.75 ) ;

		stats = new lib.StatsTable( { hp: new lib.Pool( { base: 8 , actualRound: 'round' } ) } ) ;
		statsP = stats.getProxy() ;

		expect( statsP.hp.lose( 1.5 ) ).to.be( 1.5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.lost ).to.be( 1.5 ) ;

		expect( statsP.hp.lose( 0.25 ) ).to.be( 0.25 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 6 ) ;
		expect( statsP.hp.lost ).to.be( 1.75 ) ;

		stats = new lib.StatsTable( { hp: new lib.Pool( { base: 8 , actualRound: 'ceil' } ) } ) ;
		statsP = stats.getProxy() ;

		expect( statsP.hp.lose( 1.5 ) ).to.be( 1.5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.lost ).to.be( 1.5 ) ;

		expect( statsP.hp.lose( 0.25 ) ).to.be( 0.25 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.lost ).to.be( 1.75 ) ;

		stats = new lib.StatsTable( { hp: new lib.Pool( { base: 8 , actualRound: 'floor' } ) } ) ;
		statsP = stats.getProxy() ;

		expect( statsP.hp.lose( 1.5 ) ).to.be( 1.5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 6 ) ;
		expect( statsP.hp.lost ).to.be( 1.5 ) ;

		expect( statsP.hp.lose( 0.25 ) ).to.be( 0.25 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 6 ) ;
		expect( statsP.hp.lost ).to.be( 1.75 ) ;
	} ) ;

	it( "Pool with the internal overuse turned off" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 , internalOveruse: false } )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 0 ) ;

		expect( statsP.hp.lose( 1 ) ).to.be( 1 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.lost ).to.be( 1 ) ;

		expect( statsP.hp.lose( 2 ) ).to.be( 2 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.lost ).to.be( 3 ) ;

		expect( statsP.hp.lose( 20 ) ).to.be( 5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.lost ).to.be( 8 ) ;

		expect( statsP.hp.lose( 5 ) ).to.be( 0 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.lost ).to.be( 8 ) ;
	} ) ;

	it( "Pool with overflow mode" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 , overflow: true } )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 0 ) ;

		expect( statsP.hp.add( 1 ) ).to.be( 1 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 9 ) ;
		expect( statsP.hp.lost ).to.be( - 1 ) ;

		expect( statsP.hp.add( 3 ) ).to.be( 3 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 12 ) ;
		expect( statsP.hp.lost ).to.be( - 4 ) ;

		// Should fix overflow when setting it back to false
		statsP.hp.overflow = false ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 0 ) ;
	} ) ;

	it( "Keeping track to overused lost points internally with the internal-overuse mode" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 , internalOveruse: true } )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 0 ) ;

		expect( statsP.hp.lose( 1 ) ).to.be( 1 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.lost ).to.be( 1 ) ;

		expect( statsP.hp.lose( 2 ) ).to.be( 2 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.lost ).to.be( 3 ) ;

		expect( statsP.hp.lose( 20 ) ).to.be( 20 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.lost ).to.be( 23 ) ;

		expect( statsP.hp.lose( 5 ) ).to.be( 5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.lost ).to.be( 28 ) ;

		// Restoring an overused pool
		expect( statsP.hp.restore( 15 ) ).to.be( 15 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.used ).to.be( 13 ) ;
		expect( statsP.hp.restore( 20 ) ).to.be( 13 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( 0 ) ;
	} ) ;

	it( "Keeping track to overflowed extra points internally with the internal-overflow mode" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 , internalOverflow: true } )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( 0 ) ;

		expect( statsP.hp.add( 5 ) ).to.be( 5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.used ).to.be( -5 ) ;
	} ) ;

	it( "actual-overflow / actual-overuse modes" ) ;
	it( ".cleanUp()" ) ;

	it( "Pool Stats with Modifiers" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 } )
		} ) ;

		var statsP = stats.getProxy() ;

		var mods = new lib.ModifiersTable( 'health-ring' , {
			hp: [ '+' , 2 ]
		} ) ;

		var modsP = mods.getProxy() ;

		expect( statsP.hp.lose( 5 ) ).to.be( 5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 3 ) ;
		expect( statsP.hp.actualMax ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 5 ) ;

		statsP.stack( modsP ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.actualMax ).to.be( 10 ) ;
		expect( statsP.hp.lost ).to.be( 5 ) ;

		statsP.unstack( modsP ) ;
		statsP.hp.replenish() ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.actualMax ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 0 ) ;

		statsP.stack( modsP ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 10 ) ;
		expect( statsP.hp.actualMax ).to.be( 10 ) ;
		expect( statsP.hp.lost ).to.be( 0 ) ;

		statsP.hp.lose( 2 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.actualMax ).to.be( 10 ) ;
		expect( statsP.hp.lost ).to.be( 2 ) ;
	} ) ;

	it( "Pool with a multiply Modifiers" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Pool( { base: 8 } )
		} ) ;

		var statsP = stats.getProxy() ;

		var mods = new lib.ModifiersTable( 'health-ring' , {
			hp: [ '*' , 2 ]
		} ) ;

		var modsP = mods.getProxy() ;

		statsP.hp.lose( 6 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 2 ) ;
		expect( statsP.hp.actualMax ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 6 ) ;

		statsP.stack( modsP ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 10 ) ;
		expect( statsP.hp.actualMax ).to.be( 16 ) ;
		expect( statsP.hp.lost ).to.be( 6 ) ;

		statsP.hp.lose( 1 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 9 ) ;
		expect( statsP.hp.actualMax ).to.be( 16 ) ;
		expect( statsP.hp.lost ).to.be( 7 ) ;

		statsP.unstack( modsP ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 1 ) ;
		expect( statsP.hp.actualMax ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 7 ) ;
	} ) ;

	it( "Pool Stats clone" , () => {
		var stats , statsClone , statsP , statsCloneP ;

		stats = new lib.StatsTable( { hp: new lib.Pool( { base: 100 } ) } ) ;
		statsClone = stats.clone() ;
		expect( statsClone ).not.to.be( stats ) ;
		expect( statsClone ).to.equal( stats ) ;
		expect( stats.nestedStats.stats.hp ).to.be.a( lib.Pool ) ;
		expect( statsClone.nestedStats.stats.hp ).to.be.a( lib.Pool ) ;
		expect( statsClone.nestedStats.stats.hp ).not.to.be( stats.nestedStats.stats.hp ) ;

		expect( statsClone.nestedStats.stats.hp.base ).to.be( 100 ) ;

		// Check that they are distinct
		statsClone.nestedStats.stats.hp.base = 110 ;
		expect( stats.nestedStats.stats.hp.base ).to.be( 100 ) ;
		expect( statsClone.nestedStats.stats.hp.base ).to.be( 110 ) ;

		statsClone.nestedStats.stats.hp.use( 15 ) ;
		stats.nestedStats.stats.hp.use( 20 ) ;
		expect( statsClone.nestedStats.stats.hp.getActual() ).to.be( 95 ) ;
		expect( stats.nestedStats.stats.hp.getActual() ).to.be( 80 ) ;

		// Historical bugs, when passing a proxy of Pool/HistoryAlignometer/Compound:
		stats = new lib.StatsTable( { hp: new lib.Pool( { base: 100 } ).getProxy() } ) ;
		statsClone = stats.clone() ;
		expect( stats.nestedStats.stats.hp.getProxy ).to.be.a( 'function' ) ;
		expect( statsClone.nestedStats.stats.hp.getProxy ).to.be.a( 'function' ) ;
		statsP = stats.getProxy() ;
		statsCloneP = statsP.clone() ;
		expect( statsCloneP.hp ).to.be.a( lib.Pool ) ;
		expect( statsCloneP.hp ).not.to.be( statsP.hp ) ;
		expect( statsCloneP.hp.base ).to.be( 100 ) ;
		expect( statsCloneP.hp.actual ).to.be( 100 ) ;

		stats = new lib.StatsTable( { nested: { hp: new lib.Pool( { base: 100 } ).getProxy() } } ) ;
		statsClone = stats.clone() ;
		expect( stats.nestedStats.stats.nested.stats.hp.getProxy ).to.be.a( 'function' ) ;
		expect( statsClone.nestedStats.stats.nested.stats.hp.getProxy ).to.be.a( 'function' ) ;
		statsP = stats.getProxy() ;
		statsCloneP = statsP.clone() ;
		expect( statsCloneP.nested.hp ).to.be.a( lib.Pool ) ;
		expect( statsCloneP.nested.hp ).not.to.be( statsP.nested.hp ) ;
		expect( statsCloneP.nested.hp.base ).to.be( 100 ) ;
		expect( statsCloneP.nested.hp.actual ).to.be( 100 ) ;
	} ) ;

	describe( "Allocation" , () => {

		it( "Allocating / pre-gaining points behavior" , () => {
			var stats = new lib.StatsTable( {
				hp: new lib.Pool( { base: 8 } )
			} ) ;

			var statsP = stats.getProxy() ;

			expect( statsP.hp.base ).to.be( 8 ) ;
			expect( statsP.hp.actual ).to.be( 8 ) ;
			expect( statsP.hp.used ).to.be( 0 ) ;
			expect( statsP.hp.allocated ).to.be( 0 ) ;

			expect( statsP.hp.allocate( 5 ) ).to.be( true ) ;
			expect( statsP.hp.base ).to.be( 8 ) ;
			expect( statsP.hp.actual ).to.be( 8 ) ;
			expect( statsP.hp.used ).to.be( 0 ) ;
			expect( statsP.hp.allocated ).to.be( 5 ) ;

			expect( statsP.hp.use( 5 ) ).to.be( false ) ;
			expect( statsP.hp.base ).to.be( 8 ) ;
			expect( statsP.hp.actual ).to.be( 8 ) ;
			expect( statsP.hp.used ).to.be( 0 ) ;
			expect( statsP.hp.allocated ).to.be( 5 ) ;

			expect( statsP.hp.use( 2 ) ).to.be( true ) ;
			expect( statsP.hp.base ).to.be( 8 ) ;
			expect( statsP.hp.actual ).to.be( 6 ) ;
			expect( statsP.hp.used ).to.be( 2 ) ;
			expect( statsP.hp.allocated ).to.be( 5 ) ;

			statsP.hp.commit() ;
			expect( statsP.hp.base ).to.be( 8 ) ;
			expect( statsP.hp.actual ).to.be( 1 ) ;
			expect( statsP.hp.used ).to.be( 7 ) ;
			expect( statsP.hp.allocated ).to.be( 0 ) ;

			expect( statsP.hp.preGain( 3 ) ).to.be( 3 ) ;
			expect( statsP.hp.base ).to.be( 8 ) ;
			expect( statsP.hp.actual ).to.be( 1 ) ;
			expect( statsP.hp.used ).to.be( 7 ) ;
			expect( statsP.hp.allocated ).to.be( -3 ) ;

			expect( statsP.hp.restore( 5 ) ).to.be( 4 ) ;
			expect( statsP.hp.base ).to.be( 8 ) ;
			expect( statsP.hp.actual ).to.be( 5 ) ;
			expect( statsP.hp.used ).to.be( 3 ) ;
			expect( statsP.hp.allocated ).to.be( -3 ) ;

			expect( statsP.hp.restore( 5 ) ).to.be( 0 ) ;
			expect( statsP.hp.base ).to.be( 8 ) ;
			expect( statsP.hp.actual ).to.be( 5 ) ;
			expect( statsP.hp.used ).to.be( 3 ) ;
			expect( statsP.hp.allocated ).to.be( -3 ) ;

			statsP.hp.commit() ;
			expect( statsP.hp.base ).to.be( 8 ) ;
			expect( statsP.hp.actual ).to.be( 8 ) ;
			expect( statsP.hp.used ).to.be( 0 ) ;
			expect( statsP.hp.allocated ).to.be( 0 ) ;
		} ) ;

		it( "More allocation tests" ) ;
	} ) ;

	describe( "Reserve" , () => {

		it( "Reserve's .balance() behavior" , () => {
			var stats = new lib.StatsTable( {
				attacks: new lib.Pool( { base: 3 , reserveFactor: 1 } )
			} ) ;

			var statsP = stats.getProxy() ;

			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 3 ) ;
			expect( statsP.attacks.used ).to.be( 0 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 3 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 0 ) ;

			expect( statsP.attacks.use( 3 ) ).to.be( true ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 0 ) ;
			expect( statsP.attacks.used ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 3 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 0 ) ;

			expect( statsP.attacks.balance() ).to.be( 1.5 ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 1.5 ) ;
			expect( statsP.attacks.used ).to.be( 1.5 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 1.5 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 1.5 ) ;
		} ) ;

		it( "When .actualRound is set, .balance() should round the wanted result" , () => {
			var stats = new lib.StatsTable( {
				attacks: new lib.Pool( { base: 3 , reserveFactor: 1 , actualRound: 1 } )
			} ) ;

			var statsP = stats.getProxy() ;

			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 3 ) ;
			expect( statsP.attacks.used ).to.be( 0 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 3 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 0 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 6 ) ;

			expect( statsP.attacks.use( 3 ) ).to.be( true ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 0 ) ;
			expect( statsP.attacks.used ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 3 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 0 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 3 ) ;

			expect( statsP.attacks.balance() ).to.be( 2 ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 2 ) ;
			expect( statsP.attacks.used ).to.be( 1 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 1 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 2 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 3 ) ;

			expect( statsP.attacks.use( 2 ) ).to.be( true ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 0 ) ;
			expect( statsP.attacks.used ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 1 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 2 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 1 ) ;

			expect( statsP.attacks.balance() ).to.be( 1 ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 1 ) ;
			expect( statsP.attacks.used ).to.be( 2 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 0 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 3 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 1 ) ;

			expect( statsP.attacks.use( 1 ) ).to.be( true ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 0 ) ;
			expect( statsP.attacks.used ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 0 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 3 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 0 ) ;

			expect( statsP.attacks.balance() ).to.be( 0 ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 0 ) ;
			expect( statsP.attacks.used ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 0 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 3 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 0 ) ;
		} ) ;

		it( "Reserve and modifiers" , () => {
			var stats , statsP , mods , modsP ;

			stats = new lib.StatsTable( {
				attacks: new lib.Pool( { base: 3 , reserveFactor: 1 , actualRound: 1 } )
			} ) ;
			statsP = stats.getProxy() ;

			mods = new lib.ModifiersTable( 'attack-aura' , { attacks: [ '+' , 2 ] } ) ;
			modsP = mods.getProxy() ;

			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 3 ) ;
			expect( statsP.attacks.used ).to.be( 0 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 3 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 0 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 6 ) ;

			statsP.stack( modsP ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 5 ) ;
			expect( statsP.attacks.actual ).to.be( 5 ) ;
			expect( statsP.attacks.used ).to.be( 0 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 5 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 5 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 0 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 10 ) ;

			statsP.unstack( modsP ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 3 ) ;
			expect( statsP.attacks.used ).to.be( 0 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 3 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 0 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 6 ) ;

			expect( statsP.attacks.use( 2 ) ).to.be( true ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 1 ) ;
			expect( statsP.attacks.used ).to.be( 2 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 3 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 0 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 4 ) ;

			statsP.stack( modsP ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 5 ) ;
			expect( statsP.attacks.actual ).to.be( 3 ) ;
			expect( statsP.attacks.used ).to.be( 2 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 5 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 5 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 0 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 8 ) ;

			expect( statsP.attacks.use( 2 ) ).to.be( true ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 5 ) ;
			expect( statsP.attacks.actual ).to.be( 1 ) ;
			expect( statsP.attacks.used ).to.be( 4 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 5 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 5 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 0 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 6 ) ;

			expect( statsP.attacks.balance() ).to.be( 2 ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 5 ) ;
			expect( statsP.attacks.actual ).to.be( 3 ) ;
			expect( statsP.attacks.used ).to.be( 2 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 5 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 3 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 2 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 6 ) ;

			statsP.unstack( modsP ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 1 ) ;
			expect( statsP.attacks.used ).to.be( 2 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 1 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 2 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 2 ) ;

			statsP.stack( modsP ) ;
			expect( statsP.attacks.use( 3 ) ).to.be( true ) ;
			expect( statsP.attacks.balance() ).to.be( 2 ) ;
			expect( statsP.attacks.use( 2 ) ).to.be( true ) ;
			expect( statsP.attacks.balance() ).to.be( 1 ) ;
			
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 5 ) ;
			expect( statsP.attacks.actual ).to.be( 1 ) ;
			expect( statsP.attacks.used ).to.be( 4 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 5 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 0 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 5 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 1 ) ;

			statsP.unstack( modsP ) ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 0 ) ;
			expect( statsP.attacks.used ).to.be( 4 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 0 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 5 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 0 ) ;

			statsP.attacks.cleanUp() ;
			expect( statsP.attacks.base ).to.be( 3 ) ;
			expect( statsP.attacks.actualMax ).to.be( 3 ) ;
			expect( statsP.attacks.actual ).to.be( 0 ) ;
			expect( statsP.attacks.used ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserveMax ).to.be( 3 ) ;
			expect( statsP.attacks.actualReserve ).to.be( 0 ) ;
			expect( statsP.attacks.reserveUsed ).to.be( 3 ) ;
			expect( statsP.attacks.actualPoolAndReserve ).to.be( 0 ) ;
		} ) ;

		it( "More reserve tests" )
	} ) ;
} ) ;



describe( "HistoryGauge stats" , () => {

	it( "HistoryGauge stats creation and adding entries to it" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.HistoryGauge( { base: 1 , min: 0 , max: 1 } )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be( 1 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 1 ) ;
		expect( statsP.hp.maxEntries ).to.be( Infinity ) ;
		expect( statsP.hp['max-entries'] ).to.be( Infinity ) ;

		statsP.hp.add( - 0.2 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.8 ) ;

		statsP.hp.add( - 0.1 , 0.5 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.7 ) ;

		statsP.hp.add( - 0.3 , 0.8 , "hit by a rock" ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.4 ) ;

		expect( statsP.hp.entries ).to.be.like( [
			{ value: - 0.2 , weight: 1 , description: null } ,
			{ value: - 0.1 , weight: 0.5 , description: null } ,
			{ value: - 0.3 , weight: 0.8 , description: "hit by a rock" }
		] ) ;

		expect( stats.nestedStats.stats.hp[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.hp.pathKey ).to.be( 'hp' ) ;
	} ) ;

	it( "HistoryGauge stats and recover" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.HistoryGauge( { base: 1 , min: 0 , max: 1 } )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be( 1 ) ;

		statsP.hp.add( - 0.2 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.8 ) ;
		expect( statsP.hp.entries ).to.be.like.around( [
			{ value: - 0.2 , weight: 1 , description: null }
		] ) ;

		statsP.hp.recover( 0.1 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.9 ) ;
		expect( statsP.hp.entries ).to.be.like.around( [
			{ value: - 0.1 , weight: 1 , description: null }
		] ) ;

		statsP.hp.recover( 0.1 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 1 ) ;
		expect( statsP.hp.entries ).to.be.like( [] ) ;

		statsP.hp.add( - 0.2 , 2 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.8 ) ;
		expect( statsP.hp.entries ).to.be.like.around( [
			{ value: - 0.2 , weight: 2 , description: null }
		] ) ;

		statsP.hp.recover( 0.1 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.85 ) ;
		expect( statsP.hp.entries ).to.be.like.around( [
			{ value: - 0.15 , weight: 2 , description: null }
		] ) ;

		statsP.hp.recover( 0.1 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 0.9 ) ;
		expect( statsP.hp.entries ).to.be.like.around( [
			{ value: - 0.1 , weight: 2 , description: null }
		] ) ;

		statsP.hp.recover( 0.3 ) ;
		expect( statsP.hp.base ).to.be( 1 ) ;
		expect( statsP.hp.actual ).to.be.around( 1 ) ;
		expect( statsP.hp.entries ).to.be.like.around( [] ) ;
	} ) ;

	it( "HistoryGauge stats and recover across multiple entries" , () => {
		var stats , statsP ;

		// We use integer values to avoid rounding errors
		stats = new lib.StatsTable( {
			hp: new lib.HistoryGauge( { base: 100 , min: 0 , max: 100 } )
		} ) ;

		statsP = stats.getProxy() ;

		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 100 ) ;

		statsP.hp.add( - 10 , 1 , "injury A" ) ;
		statsP.hp.add( - 20 , 1 , "injury B" ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 70 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: - 10 , weight: 1 , description: "injury A" } ,
			{ value: - 20 , weight: 1 , description: "injury B" }
		] ) ;

		statsP.hp.recover( 20 ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 90 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: - 10 , weight: 1 , description: "injury B" }
		] ) ;

		stats = new lib.StatsTable( {
			hp: new lib.HistoryGauge( { base: 100 , min: 0 , max: 100 } )
		} ) ;

		statsP = stats.getProxy() ;

		statsP.hp.add( - 4 , 1 , "injury A" ) ;
		statsP.hp.add( - 10 , 1 , "injury B" ) ;
		statsP.hp.add( - 6 , 1 , "injury C" ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 80 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: - 4 , weight: 1 , description: "injury A" } ,
			{ value: - 10 , weight: 1 , description: "injury B" } ,
			{ value: - 6 , weight: 1 , description: "injury C" }
		] ) ;

		statsP.hp.recover( 18 ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 98 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: - 2 , weight: 1 , description: "injury C" }
		] ) ;
	} ) ;

	it( "HistoryGauge stats and recover across multiple entries with different weight" , () => {
		var stats , statsP ;

		stats = new lib.StatsTable( { hp: new lib.HistoryGauge( { base: 100 , min: 0 , max: 100 } ) } ) ;
		statsP = stats.getProxy() ;
		statsP.hp.add( - 4 , 0.5 , "injury A" ) ;
		statsP.hp.add( - 10 , 2 , "injury B" ) ;
		statsP.hp.add( - 6 , 1 , "injury C" ) ;
		statsP.hp.recover( 1.5 ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 83 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: - 1 , weight: 0.5 , description: "injury A" } ,
			{ value: - 10 , weight: 2 , description: "injury B" } ,
			{ value: - 6 , weight: 1 , description: "injury C" }
		] ) ;

		stats = new lib.StatsTable( { hp: new lib.HistoryGauge( { base: 100 , min: 0 , max: 100 } ) } ) ;
		statsP = stats.getProxy() ;
		statsP.hp.add( - 4 , 0.5 , "injury A" ) ;
		statsP.hp.add( - 10 , 2 , "injury B" ) ;
		statsP.hp.add( - 6 , 1 , "injury C" ) ;
		statsP.hp.recover( 6 ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 88 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: - 10 , weight: 2 , description: "injury B" } ,
			{ value: - 2 , weight: 1 , description: "injury C" }
		] ) ;

		stats = new lib.StatsTable( { hp: new lib.HistoryGauge( { base: 100 , min: 0 , max: 100 } ) } ) ;
		statsP = stats.getProxy() ;
		statsP.hp.add( - 4 , 0.5 , "injury A" ) ;
		statsP.hp.add( - 10 , 2 , "injury B" ) ;
		statsP.hp.add( - 6 , 1 , "injury C" ) ;
		statsP.hp.recover( 18 ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 95 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: - 5 , weight: 2 , description: "injury B" }
		] ) ;
	} ) ;

	it( "add/merge entries to a HistoryGauge" , () => {
		var stats , statsP ;

		stats = new lib.StatsTable( { hp: new lib.HistoryGauge( { base: 100 , min: 0 , max: 100 } ) } ) ;
		statsP = stats.getProxy() ;
		statsP.hp.addMerge( - 4 , 1 , "hit" ) ;
		statsP.hp.addMerge( - 10 , 1 , "bleed" ) ;
		statsP.hp.addMerge( - 6 , 2 , "bleed" ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 80 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: - 4 , weight: 1 , description: "hit" } ,
			{ value: - 10 , weight: 1 , description: "bleed" } ,
			{ value: - 6 , weight: 2 , description: "bleed" }
		] ) ;

		statsP.hp.addMerge( - 2 , 1 , "bleed" ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 78 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: - 4 , weight: 1 , description: "hit" } ,
			{ value: - 12 , weight: 1 , description: "bleed" } ,
			{ value: - 6 , weight: 2 , description: "bleed" }
		] ) ;

		statsP.hp.addMerge( - 8 , 2 , "bleed" ) ;
		expect( statsP.hp.base ).to.be( 100 ) ;
		expect( statsP.hp.actual ).to.be( 70 ) ;
		expect( statsP.hp.entries ).to.be.like( [
			{ value: - 4 , weight: 1 , description: "hit" } ,
			{ value: - 12 , weight: 1 , description: "bleed" } ,
			{ value: - 14 , weight: 2 , description: "bleed" }
		] ) ;
	} ) ;

	it( "HistoryGauge stats clone" , () => {
		var stats , statsClone , statsP , statsCloneP ;

		stats = new lib.StatsTable( { hp: new lib.HistoryGauge( { base: 100 , min: 0 , max: 100 } ) } ) ;
		statsClone = stats.clone() ;
		expect( statsClone ).not.to.be( stats ) ;
		expect( statsClone ).to.equal( stats ) ;
		expect( stats.nestedStats.stats.hp ).to.be.a( lib.HistoryGauge ) ;
		expect( statsClone.nestedStats.stats.hp ).to.be.a( lib.HistoryGauge ) ;
		expect( statsClone.nestedStats.stats.hp ).not.to.be( stats.nestedStats.stats.hp ) ;
		expect( statsClone.nestedStats.stats.hp.entries ).not.to.be( stats.nestedStats.stats.hp.entries ) ;

		expect( statsClone.nestedStats.stats.hp.base ).to.be( 100 ) ;

		// Check that they are distinct
		statsClone.nestedStats.stats.hp.base = 110 ;
		expect( stats.nestedStats.stats.hp.base ).to.be( 100 ) ;
		expect( statsClone.nestedStats.stats.hp.base ).to.be( 110 ) ;

		statsClone.nestedStats.stats.hp.add( - 15 ) ;
		stats.nestedStats.stats.hp.add( - 20 ) ;
		expect( statsClone.nestedStats.stats.hp.getActual() ).to.be( 95 ) ;
		expect( stats.nestedStats.stats.hp.getActual() ).to.be( 80 ) ;
		expect( statsClone.nestedStats.stats.hp.entries ).to.be.like( [ { value: - 15 , weight: 1 , description: null } ] ) ;
		expect( stats.nestedStats.stats.hp.entries ).to.be.like( [ { value: - 20 , weight: 1 , description: null } ] ) ;

		// Historical bugs, when passing a proxy of HistoryGauge/HistoryAlignometer/Compound:
		stats = new lib.StatsTable( { hp: new lib.HistoryGauge( { base: 100 , min: 0 , max: 100 } ).getProxy() } ) ;
		statsClone = stats.clone() ;
		expect( stats.nestedStats.stats.hp.getProxy ).to.be.a( 'function' ) ;
		expect( statsClone.nestedStats.stats.hp.getProxy ).to.be.a( 'function' ) ;
		statsP = stats.getProxy() ;
		statsCloneP = statsP.clone() ;
		expect( statsCloneP.hp ).to.be.a( lib.HistoryGauge ) ;
		expect( statsCloneP.hp ).not.to.be( statsP.hp ) ;
		expect( statsCloneP.hp.entries ).not.to.be( statsP.hp.entries ) ;
		expect( statsCloneP.hp.base ).to.be( 100 ) ;
		expect( statsCloneP.hp.actual ).to.be( 100 ) ;

		stats = new lib.StatsTable( { nested: { hp: new lib.HistoryGauge( { base: 100 , min: 0 , max: 100 } ).getProxy() } } ) ;
		statsClone = stats.clone() ;
		expect( stats.nestedStats.stats.nested.stats.hp.getProxy ).to.be.a( 'function' ) ;
		expect( statsClone.nestedStats.stats.nested.stats.hp.getProxy ).to.be.a( 'function' ) ;
		statsP = stats.getProxy() ;
		statsCloneP = statsP.clone() ;
		expect( statsCloneP.nested.hp ).to.be.a( lib.HistoryGauge ) ;
		expect( statsCloneP.nested.hp ).not.to.be( statsP.nested.hp ) ;
		expect( statsCloneP.nested.hp.entries ).not.to.be( statsP.nested.hp.entries ) ;
		expect( statsCloneP.nested.hp.base ).to.be( 100 ) ;
		expect( statsCloneP.nested.hp.actual ).to.be( 100 ) ;
	} ) ;
} ) ;



describe( "HistoryAlignometer stats" , () => {

	it( "HistoryAlignometer stats creation and adding entries to it" , () => {
		var stats = new lib.StatsTable( {
			goodness: new lib.HistoryAlignometer( {
				base: 0 , min: - 100 , max: 100 , minWeight: 20 , maxEntries: 50
			} )
		} ) ;

		var statsP = stats.getProxy() ;

		expect( stats.nestedStats.stats.goodness[ lib.SYMBOL_PARENT ] ).to.be( stats ) ;
		expect( stats.nestedStats.stats.goodness.pathKey ).to.be( 'goodness' ) ;

		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 0 ) ;
		expect( statsP.goodness.instant ).to.be( 0 ) ;
		expect( statsP.goodness.min ).to.be( - 100 ) ;
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
		expect( statsP.goodness.instant ).to.be( 25 ) ;
		expect( statsP.goodness.entries ).to.be.like( [
			{
				direction: 1 , value: 100 , weight: 5 , description: "charity"
			}
		] ) ;

		// Since minWeight=20, base value has a weight of 10 here
		statsP.goodness.downward( - 100 , 5 , "brutality" ) ;
		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 0 ) ;
		expect( statsP.goodness.instant ).to.be( 0 ) ;
		expect( statsP.goodness.entries ).to.be.like.around( [
			{
				direction: 1 , value: 100 , weight: 5 , description: "charity"
			} ,
			{
				direction: - 1 , value: - 100 , weight: 5 , description: "brutality"
			}
		] ) ;

		// Since minWeight=20, base value has no more weight here
		// "not so wise" doesn't affect anything ATM, but will act as a “plateau” after 50
		statsP.goodness.downward( 50 , 10 , "not so wise" ) ;
		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 0 ) ;
		expect( statsP.goodness.instant ).to.be( 0 ) ;
		expect( statsP.goodness.entries ).to.be.like.around( [
			{
				direction: 1 , value: 100 , weight: 5 , description: "charity"
			} ,
			{
				direction: - 1 , value: - 100 , weight: 5 , description: "brutality"
			} ,
			{
				direction: - 1 , value: 50 , weight: 10 , description: "not so wise"
			}
		] ) ;

		// now "not so wise" affect things, and limit "saint's miracle"
		statsP.goodness.upward( 100 , 30 , "saint's miracle" ) ;
		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 70 ) ;
		expect( statsP.goodness.instant ).to.be( 70 ) ;
		expect( statsP.goodness.entries ).to.be.like( [
			{
				direction: 1 , value: 100 , weight: 5 , description: "charity"
			} ,
			{
				direction: - 1 , value: - 100 , weight: 5 , description: "brutality"
			} ,
			{
				direction: - 1 , value: 50 , weight: 10 , description: "not so wise"
			} ,
			{
				direction: 1 , value: 100 , weight: 30 , description: "saint's miracle"
			}
		] ) ;

		// if we remove "not so wise" we see that "saint's miracle" has more effects
		statsP.goodness.entries.splice( 2 , 1 ) ;
		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 75 ) ;
		expect( statsP.goodness.instant ).to.be( 75 ) ;
		expect( statsP.goodness.entries ).to.be.like( [
			{
				direction: 1 , value: 100 , weight: 5 , description: "charity"
			} ,
			{
				direction: - 1 , value: - 100 , weight: 5 , description: "brutality"
			} ,
			{
				direction: 1 , value: 100 , weight: 30 , description: "saint's miracle"
			}
		] ) ;

		statsP.goodness.toward( 0 , 10 , "normie" ) ;
		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be( 60 ) ;
		expect( statsP.goodness.instant ).to.be( 60 ) ;
		expect( statsP.goodness.entries ).to.be.like( [
			{
				direction: 1 , value: 100 , weight: 5 , description: "charity"
			} ,
			{
				direction: - 1 , value: - 100 , weight: 5 , description: "brutality"
			} ,
			{
				direction: 1 , value: 100 , weight: 30 , description: "saint's miracle"
			} ,
			{
				direction: 0 , value: 0 , weight: 10 , description: "normie"
			}
		] ) ;

		statsP.goodness.upward( 100 , 10 , "abnegation" ) ;
		expect( statsP.goodness.base ).to.be( 0 ) ;
		expect( statsP.goodness.actual ).to.be.around( 66.66666666666667 ) ;
		// Instant is capped to 50 weight, so charity and brutality are now out
		expect( statsP.goodness.instant ).to.be( 80 ) ;
		expect( statsP.goodness.entries ).to.be.like( [
			{
				direction: 1 , value: 100 , weight: 5 , description: "charity"
			} ,
			{
				direction: - 1 , value: - 100 , weight: 5 , description: "brutality"
			} ,
			{
				direction: 1 , value: 100 , weight: 30 , description: "saint's miracle"
			} ,
			{
				direction: 0 , value: 0 , weight: 10 , description: "normie"
			} ,
			{
				direction: 1 , value: 100 , weight: 10 , description: "abnegation"
			}
		] ) ;
	} ) ;

	it( "HistoryAlignometer stats clone" , () => {
		var stats = new lib.StatsTable( {
			goodness: new lib.HistoryAlignometer( {
				base: 0 , min: - 100 , max: 100 , minWeight: 20 , maxEntries: 50
			} )
		} ) ;

		var statsClone = stats.clone() ;
		expect( statsClone ).not.to.be( stats ) ;
		expect( statsClone ).to.equal( stats ) ;
		expect( stats.nestedStats.stats.goodness ).to.be.a( lib.HistoryAlignometer ) ;
		expect( statsClone.nestedStats.stats.goodness ).to.be.a( lib.HistoryAlignometer ) ;
		expect( statsClone.nestedStats.stats.goodness ).not.to.be( stats.nestedStats.stats.goodness ) ;
		expect( statsClone.nestedStats.stats.goodness.entries ).not.to.be( stats.nestedStats.stats.goodness.entries ) ;

		expect( statsClone.nestedStats.stats.goodness.base ).to.be( 0 ) ;

		// Check that they are distinct
		statsClone.nestedStats.stats.goodness.base = 50 ;
		expect( stats.nestedStats.stats.goodness.base ).to.be( 0 ) ;
		expect( statsClone.nestedStats.stats.goodness.base ).to.be( 50 ) ;

		statsClone.nestedStats.stats.goodness.toward( 20 , 10 ) ;
		stats.nestedStats.stats.goodness.toward( - 20 , 10 ) ;
		expect( statsClone.nestedStats.stats.goodness.getActual() ).to.be( 35 ) ;
		expect( stats.nestedStats.stats.goodness.getActual() ).to.be( - 10 ) ;
		expect( statsClone.nestedStats.stats.goodness.entries ).to.be.like( [ {
			direction: 0 , value: 20 , weight: 10 , description: null
		} ] ) ;
		expect( stats.nestedStats.stats.goodness.entries ).to.be.like( [ {
			direction: 0 , value: - 20 , weight: 10 , description: null
		} ] ) ;
	} ) ;
} ) ;



describe( "Receiving events" , () => {

	it( "One-time events" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10
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
			dexterity: 10
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
			dexterity: 10
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
			dexterity: 10
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
			dexterity: 10
		} ) ;

		var statsP = stats.getProxy() ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		var mods = new lib.ModifiersTable( 'dexterity-spell' , {
			dexterity: [ '+' , 9 ]
		} ) ;

		mods.setEvent( {
			name: 'new-turn' , every: 2 , action: 'fade' , amount: 3
		} ) ;

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

	it( "+ and * priority order" , () => {
		var stats = new lib.StatsTable( { dexterity: 14 } ) ;
		var statsP = stats.getProxy() ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		var mods = new lib.ModifiersTable( 'clumsy-ring' , {
			dexterity: [ [ '+' , 2 ] , [ '*' , 0.5 ] ]
		} ) ;

		statsP.stack( mods ) ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 8 ) ;

		statsP.unstack( mods ) ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		var mods2 = new lib.ModifiersTable( 'clumsy-ring' , {
			dexterity: [ [ '*' , 0.5 ] , [ '+' , 2 ] ]
		} ) ;

		statsP.stack( mods2 ) ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 8 ) ;
	} ) ;

	it( "+ and * modified priority order" , () => {
		var stats = new lib.StatsTable( { dexterity: 14 } ) ;
		var statsP = stats.getProxy() ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		var mods = new lib.ModifiersTable( 'clumsy-ring' , {
			dexterity: [ [ '+' , 4 , 1 ] , [ '*' , 0.5 ] ]
		} ) ;

		statsP.stack( mods ) ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 9 ) ;

		var mods2 = new lib.ModifiersTable( 'clumsy-ring2' , {
			dexterity: [ [ '+' , 4 , - 1 ] , [ '*' , 0.5 ] ]
		} ) ;

		statsP.unstack( mods ) ;
		statsP.stack( mods2 ) ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 11 ) ;
	} ) ;

	it( "base (:) operator" , () => {
		var stats = new lib.StatsTable( { dexterity: 14 } ) ;
		var statsP = stats.getProxy() ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		var mods = new lib.ModifiersTable( 'mediocre-ring' , {
			dexterity: [ ':' , 8 ]
		} ) ;

		var mods2 = new lib.ModifiersTable( 'agility-ring' , {
			dexterity: [ '+' , 2 ]
		} ) ;

		statsP.stack( mods ) ;
		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 8 ) ;

		// HAS effect!
		statsP.stack( mods2 ) ;
		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		stats = new lib.StatsTable( { dexterity: 5 } ) ;
		statsP = stats.getProxy() ;

		expect( statsP.dexterity.base ).to.be( 5 ) ;
		expect( statsP.dexterity.actual ).to.be( 5 ) ;

		statsP.stack( mods ) ;
		expect( statsP.dexterity.base ).to.be( 5 ) ;
		expect( statsP.dexterity.actual ).to.be( 8 ) ;

		// HAS effect!
		statsP.stack( mods2 ) ;
		expect( statsP.dexterity.base ).to.be( 5 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		// String
		stats = new lib.StatsTable( { name: "Alice" } ) ;
		statsP = stats.getProxy() ;
		mods = new lib.ModifiersTable( 'bobbification-ring' , {
			name: [ ':' , "Bob" ]
		} ) ;

		mods2 = new lib.ModifiersTable( 'anonymous-ring' , {
			name: [ '_+' , "357" ]
		} ) ;

		expect( statsP.name.base ).to.be( "Alice" ) ;
		expect( statsP.name.actual ).to.be( "Alice" ) ;

		statsP.stack( mods ) ;
		expect( statsP.name.base ).to.be( "Alice" ) ;
		expect( statsP.name.actual ).to.be( "Bob" ) ;

		statsP.stack( mods2 ) ;
		expect( statsP.name.base ).to.be( "Alice" ) ;
		expect( statsP.name.actual ).to.be( "Bob 357" ) ;
	} ) ;

	it( "set (=) operator" , () => {
		var stats = new lib.StatsTable( { dexterity: 14 } ) ;
		var statsP = stats.getProxy() ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		var mods = new lib.ModifiersTable( 'mediocre-ring' , {
			dexterity: [ '=' , 8 ]
		} ) ;

		var mods2 = new lib.ModifiersTable( 'agility-ring' , {
			dexterity: [ '+' , 2 ]
		} ) ;

		statsP.stack( mods ) ;
		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 8 ) ;

		// No effect!
		statsP.stack( mods2 ) ;
		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 8 ) ;

		stats = new lib.StatsTable( { dexterity: 5 } ) ;
		statsP = stats.getProxy() ;

		expect( statsP.dexterity.base ).to.be( 5 ) ;
		expect( statsP.dexterity.actual ).to.be( 5 ) ;

		statsP.stack( mods ) ;
		expect( statsP.dexterity.base ).to.be( 5 ) ;
		expect( statsP.dexterity.actual ).to.be( 8 ) ;

		// No effect!
		statsP.stack( mods2 ) ;
		expect( statsP.dexterity.base ).to.be( 5 ) ;
		expect( statsP.dexterity.actual ).to.be( 8 ) ;

		// String
		stats = new lib.StatsTable( { name: "Alice" } ) ;
		statsP = stats.getProxy() ;
		mods = new lib.ModifiersTable( 'bobbification-ring' , {
			name: [ '=' , "Bob" ]
		} ) ;

		mods2 = new lib.ModifiersTable( 'anonymous-ring' , {
			name: [ '_+' , "357" ]
		} ) ;

		expect( statsP.name.base ).to.be( "Alice" ) ;
		expect( statsP.name.actual ).to.be( "Alice" ) ;

		statsP.stack( mods ) ;
		expect( statsP.name.base ).to.be( "Alice" ) ;
		expect( statsP.name.actual ).to.be( "Bob" ) ;

		statsP.stack( mods2 ) ;
		expect( statsP.name.base ).to.be( "Alice" ) ;
		expect( statsP.name.actual ).to.be( "Bob" ) ;

		statsP.unstack( mods ) ;
		expect( statsP.name.base ).to.be( "Alice" ) ;
		expect( statsP.name.actual ).to.be( "Alice 357" ) ;
	} ) ;

	it( "atLeast (>=) operator" , () => {
		var stats = new lib.StatsTable( { dexterity: 14 } ) ;
		var statsP = stats.getProxy() ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		var mods = new lib.ModifiersTable( 'hermes-ring' , {
			dexterity: [ '>=' , 30 ]
		} ) ;

		var mods2 = new lib.ModifiersTable( 'agility-ring' , {
			dexterity: [ '+' , 2 ]
		} ) ;

		statsP.stack( mods ) ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 30 ) ;

		// No effect!
		statsP.stack( mods2 ) ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 30 ) ;

		stats = new lib.StatsTable( { dexterity: 40 } ) ;
		statsP = stats.getProxy() ;

		expect( statsP.dexterity.base ).to.be( 40 ) ;
		expect( statsP.dexterity.actual ).to.be( 40 ) ;

		statsP.stack( mods ) ;

		expect( statsP.dexterity.base ).to.be( 40 ) ;
		expect( statsP.dexterity.actual ).to.be( 40 ) ;

		// HAS effect!
		statsP.stack( mods2 ) ;

		expect( statsP.dexterity.base ).to.be( 40 ) ;
		expect( statsP.dexterity.actual ).to.be( 42 ) ;
	} ) ;

	it( "atMost (<=) operator" , () => {
		var stats = new lib.StatsTable( { dexterity: 14 } ) ;
		var statsP = stats.getProxy() ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		var mods = new lib.ModifiersTable( 'ultimate-curse-ring' , {
			dexterity: [ '<=' , 3 ]
		} ) ;

		var mods2 = new lib.ModifiersTable( 'agility-ring' , {
			dexterity: [ '+' , 2 ]
		} ) ;

		statsP.stack( mods ) ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 3 ) ;

		// No effect!
		statsP.stack( mods2 ) ;

		expect( statsP.dexterity.base ).to.be( 14 ) ;
		expect( statsP.dexterity.actual ).to.be( 3 ) ;

		stats = new lib.StatsTable( { dexterity: 1 } ) ;
		statsP = stats.getProxy() ;

		expect( statsP.dexterity.base ).to.be( 1 ) ;
		expect( statsP.dexterity.actual ).to.be( 1 ) ;

		statsP.stack( mods ) ;

		expect( statsP.dexterity.base ).to.be( 1 ) ;
		expect( statsP.dexterity.actual ).to.be( 1 ) ;

		// HAS effect!
		statsP.stack( mods2 ) ;

		expect( statsP.dexterity.base ).to.be( 1 ) ;
		expect( statsP.dexterity.actual ).to.be( 3 ) ;
	} ) ;

	it( "percent (%) operator (works with KFG percent numbers)" , () => {
		var stats = new lib.StatsTable( { dexterity: 10 } ) ;
		var statsP = stats.getProxy() ;

		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		var mods = new lib.ModifiersTable( 'agility-ring' , { dexterity: [ '%' , 1.2 ] } ) ;
		var mods2 = new lib.ModifiersTable( 'agility-ring2' , { dexterity: [ '%' , 1.3 ] } ) ;
		var mods3 = new lib.ModifiersTable( 'agility-ring3' , { dexterity: [ '%' , 1.4 ] } ) ;

		statsP.stack( mods ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 12 ) ;

		statsP.stack( mods2 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 15 ) ;

		statsP.stack( mods3 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 19 ) ;
	} ) ;

	it( "power (^ or **) operator" , () => {
		var stats = new lib.StatsTable( { dexterity: 10 } ) ;
		var statsP = stats.getProxy() ;

		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		var mods = new lib.ModifiersTable( 'agility-ring' , { dexterity: [ '^' , 2 ] } ) ;
		var mods2 = new lib.ModifiersTable( 'agility-ring2' , { dexterity: [ '**' , 3 ] } ) ;

		statsP.stack( mods ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 100 ) ;

		statsP.stack( mods2 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 1000000 ) ;
	} ) ;

	it( "append (_+) operator" , () => {
		var stats = new lib.StatsTable( { text: "some" } ) ;
		var statsP = stats.getProxy() ;

		expect( statsP.text.base ).to.be( "some" ) ;
		expect( statsP.text.actual ).to.be( "some" ) ;

		var mods = new lib.ModifiersTable( 'mods' , { text: [ '_+' , 'text' ] } ) ;
		var mods2 = new lib.ModifiersTable( 'mods2' , { text: [ '_+' , 'again' ] } ) ;

		statsP.stack( mods ) ;
		expect( statsP.text.base ).to.be( "some" ) ;
		expect( statsP.text.actual ).to.be( "some text" ) ;

		statsP.stack( mods2 ) ;
		expect( statsP.text.base ).to.be( "some" ) ;
		expect( statsP.text.actual ).to.be( "some text again" ) ;
	} ) ;

	it( "prepend (+_) operator" , () => {
		var stats = new lib.StatsTable( { text: "some" } ) ;
		var statsP = stats.getProxy() ;

		expect( statsP.text.base ).to.be( "some" ) ;
		expect( statsP.text.actual ).to.be( "some" ) ;

		var mods = new lib.ModifiersTable( 'mods' , { text: [ '+_' , 'text' ] } ) ;
		var mods2 = new lib.ModifiersTable( 'mods2' , { text: [ '+_' , 'again' ] } ) ;

		statsP.stack( mods ) ;
		expect( statsP.text.base ).to.be( "some" ) ;
		expect( statsP.text.actual ).to.be( "text some" ) ;

		statsP.stack( mods2 ) ;
		expect( statsP.text.base ).to.be( "some" ) ;
		expect( statsP.text.actual ).to.be( "again text some" ) ;
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

