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



describe( "Gauge stats [Deprecated?]" , () => {

	it( "Gauge stats creation" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 8 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.spent ).to.be( 0 ) ;
	} ) ;

	it( "Adding points of a Gauge" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 8 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.spent ).to.be( 0 ) ;

		expect( statsP.hp.add( -3 ) ).to.be( -3 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.gained ).to.be( 0 ) ;
		expect( statsP.hp.spent ).to.be( 3 ) ;

		expect( statsP.hp.add( 2 ) ).to.be( 2 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.gained ).to.be( 0 ) ;
		expect( statsP.hp.spent ).to.be( 1 ) ;

		expect( statsP.hp.add( 20 ) ).to.be( 1 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.gained ).to.be( 0 ) ;
		expect( statsP.hp.spent ).to.be( 0 ) ;

		expect( statsP.hp.add( -50 ) ).to.be( -8 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.gained ).to.be( 0 ) ;
		expect( statsP.hp.spent ).to.be( 8 ) ;
	} ) ;
	
	it( "Losing points of a Gauge" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 8 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.spent ).to.be( 0 ) ;

		expect( statsP.hp.lose( 1 ) ).to.be( 1 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.spent ).to.be( 1 ) ;

		expect( statsP.hp.lose( 2 ) ).to.be( 2 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.spent ).to.be( 3 ) ;

		expect( statsP.hp.lose( 20 ) ).to.be( 5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.spent ).to.be( 8 ) ;

		expect( statsP.hp.lose( 5 ) ).to.be( 0 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.spent ).to.be( 8 ) ;
	} ) ;
	
	it( "Spending points of a Gauge" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 8 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.spent ).to.be( 0 ) ;

		expect( statsP.hp.spend( 1 ) ).to.be( true ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 7 ) ;
		expect( statsP.hp.spent ).to.be( 1 ) ;

		expect( statsP.hp.spend( 2 ) ).to.be( true ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.spent ).to.be( 3 ) ;

		expect( statsP.hp.spend( 20 ) ).to.be( false ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.spent ).to.be( 3 ) ;

		expect( statsP.hp.spend( 5 ) ).to.be( true ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.spent ).to.be( 8 ) ;
	} ) ;
	
	it( "Replenishing the Gauge" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 8 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.spent ).to.be( 0 ) ;

		expect( statsP.hp.lose( 5 ) ).to.be( 5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 3 ) ;
		expect( statsP.hp.spent ).to.be( 5 ) ;

		expect( statsP.hp.replenish() ).to.be( 5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.spent ).to.be( 0 ) ;

		expect( statsP.hp.lose( 20 ) ).to.be( 8 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.spent ).to.be( 8 ) ;

		expect( statsP.hp.replenish() ).to.be( 8 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.spent ).to.be( 0 ) ;
	} ) ;
	
	it( "Emptying the Gauge" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 8 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.spent ).to.be( 0 ) ;

		expect( statsP.hp.empty() ).to.be( 8 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.spent ).to.be( 8 ) ;
	} ) ;

	it( "Restoring the Gauge" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 6 , max: 8 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.hp.base ).to.be( 6 ) ;
		expect( statsP.hp.actual ).to.be( 6 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.spent ).to.be( 0 ) ;

		expect( statsP.hp.empty() ).to.be( 6 ) ;
		expect( statsP.hp.base ).to.be( 6 ) ;
		expect( statsP.hp.actual ).to.be( 0 ) ;
		expect( statsP.hp.spent ).to.be( 6 ) ;

		expect( statsP.hp.restore() ).to.be( 6 ) ;
		expect( statsP.hp.base ).to.be( 6 ) ;
		expect( statsP.hp.actual ).to.be( 6 ) ;
		expect( statsP.hp.spent ).to.be( 0 ) ;

		expect( statsP.hp.replenish() ).to.be( 2 ) ;
		expect( statsP.hp.base ).to.be( 6 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.gained ).to.be( 2 ) ;

		expect( statsP.hp.restore() ).to.be( -2 ) ;
		expect( statsP.hp.base ).to.be( 6 ) ;
		expect( statsP.hp.actual ).to.be( 6 ) ;
		expect( statsP.hp.spent ).to.be( 0 ) ;
	} ) ;
	
	it( "Gaining points of a Gauge" , () => {
		var stats = new lib.StatsTable( {
			xp: new lib.Gauge( { base: 0, max: 10 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.xp.base ).to.be( 0 ) ;
		expect( statsP.xp.actual ).to.be( 0 ) ;
		expect( statsP.xp.gained ).to.be( 0 ) ;

		expect( statsP.xp.gain( 1 ) ).to.be( 1 ) ;
		expect( statsP.xp.base ).to.be( 0 ) ;
		expect( statsP.xp.actual ).to.be( 1 ) ;
		expect( statsP.xp.gained ).to.be( 1 ) ;

		expect( statsP.xp.gain( 8 ) ).to.be( 8 ) ;
		expect( statsP.xp.base ).to.be( 0 ) ;
		expect( statsP.xp.actual ).to.be( 9 ) ;
		expect( statsP.xp.gained ).to.be( 9 ) ;

		expect( statsP.xp.gain( 8 ) ).to.be( 1 ) ;
		expect( statsP.xp.base ).to.be( 0 ) ;
		expect( statsP.xp.actual ).to.be( 10 ) ;
		expect( statsP.xp.gained ).to.be( 10 ) ;
	} ) ;
	
	it( "Refilling points of a Gauge" , () => {
		var stats = new lib.StatsTable( {
			xp: new lib.Gauge( { base: 0, max: 10 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		expect( statsP.xp.base ).to.be( 0 ) ;
		expect( statsP.xp.actual ).to.be( 0 ) ;
		expect( statsP.xp.gained ).to.be( 0 ) ;

		expect( statsP.xp.refill( 1 ) ).to.be( true ) ;
		expect( statsP.xp.base ).to.be( 0 ) ;
		expect( statsP.xp.actual ).to.be( 1 ) ;
		expect( statsP.xp.gained ).to.be( 1 ) ;

		expect( statsP.xp.refill( 8 ) ).to.be( true ) ;
		expect( statsP.xp.base ).to.be( 0 ) ;
		expect( statsP.xp.actual ).to.be( 9 ) ;
		expect( statsP.xp.gained ).to.be( 9 ) ;

		expect( statsP.xp.refill( 8 ) ).to.be( false ) ;
		expect( statsP.xp.base ).to.be( 0 ) ;
		expect( statsP.xp.actual ).to.be( 9 ) ;
		expect( statsP.xp.gained ).to.be( 9 ) ;
	} ) ;

	it( "Gauge stats with Modifiers" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 8 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'health-ring' , {
			hp: [ '+' , 2 ]
		} ) ;

		var modsP = mods.getProxy() ;

		expect( statsP.hp.lose( 5 ) ).to.be( 5 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 3 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 5 ) ;

		statsP.stack( modsP ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 5 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 5 ) ;

		statsP.unstack( modsP ) ;
		statsP.hp.replenish() ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 0 ) ;

		statsP.stack( modsP ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 0 ) ;

		statsP.hp.lose( 2 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 2 ) ;
	} ) ;

	it( "Gauge stats with Modifiers on .max" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 8 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'health-ring' , {
			"hp.max": [ '+' , 5 ]
		} ) ;

		var modsP = mods.getProxy() ;

		statsP.stack( modsP ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 0 ) ;
		expect( statsP.hp.actualMax ).to.be( 13 ) ;

		expect( statsP.hp.gain( 2 ) ).to.be( 2 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 10 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.gained ).to.be( 2 ) ;
		expect( statsP.hp.actualMax ).to.be( 13 ) ;

		expect( statsP.hp.gain( 8 ) ).to.be( 3 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 13 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.gained ).to.be( 5 ) ;
		expect( statsP.hp.actualMax ).to.be( 13 ) ;

		statsP.unstack( modsP ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 8 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.gained ).to.be( 5 ) ;
		expect( statsP.hp.actualMax ).to.be( 8 ) ;
	} ) ;
	
	it( "Gauge stats with Modifiers on base and .max" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 8 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'health-ring' , {
			hp: [ '+' , 5 ] ,
			"hp.max": [ '+' , 5 ]
		} ) ;

		var modsP = mods.getProxy() ;

		statsP.stack( modsP ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 13 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 0 ) ;
		expect( statsP.hp.actualMax ).to.be( 13 ) ;

		expect( statsP.hp.gain( 2 ) ).to.be( 0 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 13 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.gained ).to.be( 0 ) ;
		expect( statsP.hp.actualMax ).to.be( 13 ) ;

		expect( statsP.hp.lose( 7 ) ).to.be( 7 ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 6 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 7 ) ;
		expect( statsP.hp.actualMax ).to.be( 13 ) ;

		statsP.unstack( modsP ) ;
		expect( statsP.hp.base ).to.be( 8 ) ;
		expect( statsP.hp.actual ).to.be( 1 ) ;
		expect( statsP.hp.min ).to.be( 0 ) ;
		expect( statsP.hp.max ).to.be( 8 ) ;
		expect( statsP.hp.lost ).to.be( 7 ) ;
		expect( statsP.hp.actualMax ).to.be( 8 ) ;
	} ) ;
	
	it( "Gauge having a multiply Modifiers" , () => {
		var stats = new lib.StatsTable( {
			hp: new lib.Gauge( { base: 8 } )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'health-ring' , {
			hp: [ '*' , 2 ] ,
			"hp.max": [ '*' , 2 ]
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

	it( "Gauge stats clone" , () => {
		var stats , statsClone , statsP , statsCloneP ;
		
		stats = new lib.StatsTable( { hp: new lib.Gauge( { base: 100 , min: 0 , max: 100 } ) } ) ;
		statsClone = stats.clone() ;
		expect( statsClone ).not.to.be( stats ) ;
		expect( statsClone ).to.equal( stats ) ;
		expect( stats.stats.hp ).to.be.a( lib.Gauge ) ;
		expect( statsClone.stats.hp ).to.be.a( lib.Gauge ) ;
		expect( statsClone.stats.hp ).not.to.be( stats.stats.hp ) ;

		expect( statsClone.stats.hp.base ).to.be( 100 ) ;

		// Check that they are distinct
		statsClone.stats.hp.base = 110 ;
		expect( stats.stats.hp.base ).to.be( 100 ) ;
		expect( statsClone.stats.hp.base ).to.be( 110 ) ;

		statsClone.stats.hp.spend( 15 ) ;
		stats.stats.hp.spend( 20 ) ;
		expect( statsClone.stats.hp.getActual() ).to.be( 95 ) ;
		expect( stats.stats.hp.getActual() ).to.be( 80 ) ;
		
		// Historical bugs, when passing a proxy of Gauge/HistoryAlignometer/Compound:
		stats = new lib.StatsTable( { hp: new lib.Gauge( { base: 100 , min: 0 , max: 100 } ).getProxy() } ) ;
		statsClone = stats.clone() ;
		expect( stats.stats.hp.getProxy ).to.be.a( 'function' ) ;
		expect( statsClone.stats.hp.getProxy ).to.be.a( 'function' ) ;
		statsP = stats.getProxy() ;
		statsCloneP = statsP.clone() ;
		expect( statsCloneP.hp ).to.be.a( lib.Gauge ) ;
		expect( statsCloneP.hp ).not.to.be( statsP.hp ) ;
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
		expect( statsCloneP.nested.hp.base ).to.be( 100 ) ;
		expect( statsCloneP.nested.hp.actual ).to.be( 100 ) ;
	} ) ;
} ) ;



describe( "OldTraits" , () => {

	it( "StatsTable with implicit OldTraits stats creation (Set)" , () => {
		var stats = new lib.StatsTable( {
			traits: new Set( [ 'living' , 'hero' ] )
		} ) ;
		
		var statsP = stats.getProxy() ;

		var v = statsP.traits.base ;
		
		//log( "Stats: %[5]I" , stats ) ;
		expect( stats.stats.traits ).to.be.a( lib.OldTraits ) ;
		expect( stats.stats.traits.base ).to.be.a( Set ) ;
		expect( stats.stats.traits.base ).to.only.contain( 'living' , 'hero' ) ;

		expect( statsP.traits ).to.be.a( lib.OldTraits ) ;
		expect( statsP.traits.base ).to.be.a( Set ) ;
		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.unexistant ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( true ) ;
		expect( statsP.traits.actual.hero ).to.be( true ) ;
		expect( statsP.traits.actual.unexistant ).to.be( false ) ;
		expect( Object.keys( statsP.traits.actual ) ).to.only.contain( 'living' , 'hero' ) ;
	} ) ;

	it( "StatsTable with explicit OldTraits stats creation" , () => {
		var stats = new lib.StatsTable( {
			traits: new lib.OldTraits( [ 'living' , 'hero' ] )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		//log( "Stats: %[5]I" , stats ) ;
		expect( stats.stats.traits ).to.be.a( lib.OldTraits ) ;
		expect( stats.stats.traits.base ).to.be.a( Set ) ;
		expect( stats.stats.traits.base ).to.only.contain( 'living' , 'hero' ) ;

		expect( statsP.traits ).to.be.a( lib.OldTraits ) ;
		expect( statsP.traits.base ).to.be.a( Set ) ;
		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.unexistant ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( true ) ;
		expect( statsP.traits.actual.hero ).to.be( true ) ;
		expect( statsP.traits.actual.unexistant ).to.be( false ) ;
		expect( Object.keys( statsP.traits.actual ) ).to.only.contain( 'living' , 'hero' ) ;
	} ) ;

	it( "OldTraits stat with Modifiers featuring the add/remove operator" , () => {
		var stats = new lib.StatsTable( {
			traits: new lib.OldTraits( [ 'living' , 'hero' ] )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'initiative-ring' , {
			traits: [ '#+' , 'firstStrike' ]
		} ) ;

		var modsP = mods.getProxy() ;

		var mods2 = new lib.ModifiersTable( 'undead-ring' , {
			traits: [ '#-' , [ 'firstStrike' , 'living' ] ]
		} ) ;

		var mods2P = mods2.getProxy() ;

		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( true ) ;
		expect( statsP.traits.actual.hero ).to.be( true ) ;
		expect( statsP.traits.actual.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.actual ) ).to.only.contain( 'living' , 'hero' ) ;

		statsP.stack( modsP ) ;
		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( true ) ;
		expect( statsP.traits.actual.hero ).to.be( true ) ;
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
	} ) ;

	it( "OldTraits stat with Modifiers featuring the instersect operator" , () => {
		var stats = new lib.StatsTable( {
			traits: new lib.OldTraits( [ 'living' , 'hero' ] )
		} ) ;
		
		var statsP = stats.getProxy() ;
		
		var mods = new lib.ModifiersTable( 'random-ring' , {
			traits: [ '#*' , 'living' , 'firstStrike' ]
		} ) ;

		var modsP = mods.getProxy() ;

		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( true ) ;
		expect( statsP.traits.actual.hero ).to.be( true ) ;
		expect( statsP.traits.actual.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.actual ) ).to.only.contain( 'living' , 'hero' ) ;

		statsP.stack( modsP ) ;
		expect( statsP.traits.base.living ).to.be( true ) ;
		expect( statsP.traits.base.hero ).to.be( true ) ;
		expect( statsP.traits.base.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.base ) ).to.only.contain( 'living' , 'hero' ) ;
		expect( statsP.traits.actual.living ).to.be( true ) ;
		expect( statsP.traits.actual.hero ).to.be( false ) ;
		expect( statsP.traits.actual.firstStrike ).to.be( false ) ;
		expect( Object.keys( statsP.traits.actual ) ).to.only.contain( 'living' ) ;
	} ) ;
} ) ;



