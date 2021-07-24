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
	
	it( "ModifiersTable creation using the object syntax (KFG)" , () => {
		var mods = new lib.ModifiersTable( 'staff' , {
			strength: { operator: '+' , operand: 5 } ,
			dexterity: [ { operator: '-' , operand: 2 } , { operator: '*' , operand: 0.8 } ]
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
	
	it( "Adding/removing a ModifiersTable to a StatsTable" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: 20
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 12 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 15 ) ;

		var mods = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} ) ;
		

		stats.stack( mods ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 17 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;


		stats.unstack( mods ) ;

		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 12 ) ;
		expect( statsP.strength.actual ).to.be( 12 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 15 ) ;


		var mods2 = new lib.ModifiersTable( 'ring-of-strength' , {
			strength: [ '+' , 2 ]
		} ) ;
		
		stats.stack( mods ) ;
		stats.stack( mods2 ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 19 ) ;
		expect( statsP.strength.actual ).to.be( 19 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;
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
		expect( stats.stats.strength.getActual() ).to.be( 17 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;
		
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
	} ) ;
		
	it( "Updating a ModifiersTable already stacked on a StatsTable" , () => {
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
		
		var modsP = mods.getProxy() ;

		stats.stack( mods ) ;
		
		expect( stats.stats.strength.base ).to.be( 12 ) ;
		expect( statsP.strength.base ).to.be( 12 ) ;
		expect( stats.stats.strength.getActual() ).to.be( 17 ) ;
		expect( statsP.strength.actual ).to.be( 17 ) ;
		expect( stats.stats.dexterity.getActual() ).to.be( 10 ) ;
		
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
	} ) ;
	
	it( "Accessing a ModifiersTable from a StatsTable" , () => {
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

		var mods2 = new lib.ModifiersTable( 'ring-of-strength' , {
			strength: [ '+' , 2 ]
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
	} ) ;
	
	it( "Activate and deactivate modifiers" , () => {
		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: 20
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'staff' , { dexterity: [ '-' , 2 ] } , true ) ,
			mods2 = new lib.ModifiersTable( 'agile-spell' , { dexterity: [ '+' , 5 ] } , false ) ;
		
		stats.stack( mods ) ;
		stats.stack( mods2 ) ;
		
		expect( stats.stats.dexterity.getActual() ).to.be( 13 ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;
		
		mods2.activate() ;
		expect( stats.stats.dexterity.getActual() ).to.be( 18 ) ;
		expect( statsP.dexterity.actual ).to.be( 18 ) ;

		mods.deactivate() ;
		expect( stats.stats.dexterity.getActual() ).to.be( 20 ) ;
		expect( statsP.dexterity.actual ).to.be( 20 ) ;
	} ) ;
} ) ;



describe( "ModifiersTable templates" , () => {

	it( "ModifiersTable template creation" , () => {
		var modsTemplate = new lib.ModifiersTable( 'staff' , {
			strength: [ '+' , 5 ] ,
			dexterity: [ [ '-' , 2 ] , [ '*' , 0.8 ] ]
		} , undefined , true ) ;
		
		var mods = modsTemplate.instanciate() ;
		//console.log( "mods:" , mods , mods.statsModifiers ) ;
		expect( mods.id ).to.be( 'staff:0' ) ;

		var stats = new lib.StatsTable( {
			strength: 12 ,
			dexterity: 15 ,
			hp: 20
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		statsP.stack( modsTemplate ) ;

		expect( stats.modifiersTables[ 0 ] ).to.be.partially.like( {
			id: 'staff:1' ,
			statsModifiers: {
				strength: {
					plus: { id: 'staff:1' , operator: 'plus' , operand: 5 }
				} ,
				dexterity: {
					plus: { id: 'staff:1' , operator: 'plus' , operand: -2 } ,
					multiply: { id: 'staff:1' , operator: 'multiply' , operand: 0.8 }
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
			defense: new lib.Compound( 'average' , [ 'reflex' , 'dexterity' ] )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( statsP.defense.base ).to.be( null ) ;
		expect( statsP.defense.actual ).to.be( 13 ) ;
	} ) ;

	it( "Compound stats and KFG compatibility" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: { operator: 'average' , operand: [ 'reflex' , 'dexterity' ] }
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( statsP.defense.base ).to.be( null ) ;
		expect( statsP.defense.actual ).to.be( 13 ) ;
	} ) ;

	it( "Compound stats should use modifiers of primary stats" , () => {
		var stats = new lib.StatsTable( {
			reflex: 16 ,
			dexterity: 10 ,
			defense: new lib.Compound( 'average' , [ 'reflex' , 'dexterity' ] )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;
		expect( statsP.defense.base ).to.be( null ) ;
		expect( statsP.defense.actual ).to.be( 13 ) ;

		var mods = new lib.ModifiersTable( 'ring-of-dexterity' , {
			dexterity: [ '+' , 4 ]
		} ) ;
		
		var modsP = mods.getProxy() ;

		statsP.stack( modsP ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;
		expect( statsP.defense.base ).to.be( null ) ;
		expect( statsP.defense.actual ).to.be( 15 ) ;

		var mods2 = new lib.ModifiersTable( 'helm-of-defense' , {
			defense: [ '+' , 3 ]
		} ) ;

		var mods2P = mods2.getProxy() ;

		statsP.stack( mods2P ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;
		expect( statsP.defense.base ).to.be( null ) ;
		expect( statsP.defense.actual ).to.be( 18 ) ;
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

		stats.receiveEvent( 'new-turn' ) ;

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

		stats.receiveEvent( 'new-turn' ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		stats.receiveEvent( 'new-turn' ) ;

		expect( statsP.reflex.base ).to.be( 16 ) ;
		expect( statsP.reflex.actual ).to.be( 16 ) ;
		expect( statsP.dexterity.base ).to.be( 10 ) ;
		expect( statsP.dexterity.actual ).to.be( 14 ) ;

		stats.receiveEvent( 'new-turn' ) ;

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

		stats.receiveEvent( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;

		stats.receiveEvent( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 12 ) ;

		stats.receiveEvent( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 11 ) ;

		stats.receiveEvent( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		stats.receiveEvent( 'new-turn' ) ;
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
		
		mods.setEveryEvent( 'new-turn' , 2 , 'fade' , 3 ) ;
		
		statsP.stack( mods ) ;
		expect( statsP.dexterity.actual ).to.be( 19 ) ;

		stats.receiveEvent( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 19 ) ;

		stats.receiveEvent( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 16 ) ;

		stats.receiveEvent( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 16 ) ;

		stats.receiveEvent( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;

		stats.receiveEvent( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 13 ) ;

		stats.receiveEvent( 'new-turn' ) ;
		expect( statsP.dexterity.actual ).to.be( 10 ) ;

		stats.receiveEvent( 'new-turn' ) ;
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
} ) ;

