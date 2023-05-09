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



/*
	An HistoryGauge is used for complex gauge system like hit points tracking each injuries.
*/

function HistoryGauge( params = {} , parentTable = null , pathKey = null , clone = false ) {
	Stat.call( this , + params.base || 0 , parentTable , pathKey ) ;

	this.min = + params.min || 0 ;
	this.max = + params.max || 0 ;

	this.maxEntries = params.maxEntries ?? params['max-entries'] ;
	this.maxEntries = Number.isFinite( this.maxEntries ) && this.maxEntries > 0 ? this.maxEntries : Infinity ;

	this.entries = Array.isArray( params.entries ) ? params.entries.map( e => ( e instanceof Entry ) && ! clone ? e : new Entry( e ) ) : [] ;
}

const Stat = require( './Stat.js' ) ;
HistoryGauge.prototype = Object.create( Stat.prototype ) ;
HistoryGauge.prototype.constructor = HistoryGauge ;

module.exports = HistoryGauge ;



const common = require( './common.js' ) ;
const arrayKit = require( 'array-kit' ) ;



HistoryGauge.prototype.operandType = 'number' ;

HistoryGauge.prototype.proxyMethods = {
	add: 'add' ,
	addMerge: 'addMerge' ,
	'add-merge': 'addMerge' ,
	recover: 'recover'
} ;

HistoryGauge.prototype.proxyProperties = {
	min: 'min' ,
	max: 'max' ,
	maxEntries: 'maxEntries' ,
	'max-entries': 'maxEntries' ,
	entries: 'entries'
} ;

HistoryGauge.prototype.proxyWritableProperties = {
	min: 'min' ,
	max: 'max' ,
	maxEntries: 'maxEntries' ,
	'max-entries': 'maxEntries'
} ;

HistoryGauge.prototype.proxyGetters = {} ;
HistoryGauge.prototype.proxySetters = {} ;



HistoryGauge.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new HistoryGauge( this , parentTable , pathKey , true ) ;
} ;



/*
	An entry is an object with those properties:
	* value: any real number (usually between -1 and 1), that will modify the gauge
	* weight: not directly used, but userland can use it for use case like hit point recovery
	* description: string, optional
*/
function Entry( value , weight , description ) {
	// Change here should be reflected in HistoryGauge#addMerge()
	if ( value && typeof value === 'object' ) {
		( { value , weight , description } = value ) ;
	}

	this.value = + value || 0 ;
	this.weight = Number.isFinite( weight ) && weight > 0 ? weight : 1 ;
	this.description = typeof description === 'string' ? description : null ;
}

HistoryGauge.Entry = Entry ;



HistoryGauge.prototype.getActual = function( pathKey = this.pathKey ) {
	var base = this.getBase() ,
		actual = this.entries.reduce( ( accumulator , entry ) => accumulator + entry.value , base ) ;

	actual = this.computeModifiers( actual , base , pathKey ) ;
	actual = Math.max( this.min , Math.min( this.max , actual ) ) ;
	return actual ;
} ;



HistoryGauge.prototype.add = function( value , weight , description ) {
	var entry ;

	if ( value instanceof Entry ) {
		entry = value ;
	}
	else {
		if ( value && typeof value === 'object' ) {
			( { value , weight , description } = value ) ;
		}

		if ( ! value ) { return ; }
		entry = new Entry( value , weight , description ) ;
	}

	this.entries.push( entry ) ;

	if ( this.entries.length > this.maxEntries ) {
		this.entries = this.entries.splice( 0 , this.entries.length - this.maxEntries ) ;
	}
} ;



HistoryGauge.prototype.addMerge = function( value , weight , description ) {
	// Same argument management than Entry constructor
	if ( value && typeof value === 'object' ) {
		( { value , weight , description } = value ) ;
	}

	value = + value ;
	if ( ! value ) { return ; }

	weight = Number.isFinite( weight ) && weight > 0 ? weight : 1 ;
	description = typeof description === 'string' ? description : null ;

	var compatibleEntry = this.entries.find( entry =>
		entry.weight === weight && entry.description === description && entry.value * value > 0
	) ;

	if ( compatibleEntry ) {
		compatibleEntry.value += value ;
	}
	else {
		this.add( value , weight , description ) ;
	}
} ;



HistoryGauge.prototype.recover = function( value ) {
	var entry , minWeightEntry , recoverValue , useFactor , minWeight , changed = false ;

	// Better than for(;;) because of rounding errors
	while ( value ) {
		minWeight = Infinity ;
		minWeightEntry = null ;

		// First, find the entry with the lowest weight, which will be the easiest to recover from
		for ( entry of this.entries ) {
			// Ensure that the recover value is going on the other side of the entry value
			if ( entry.weight < minWeight && entry.value * value < 0 ) {
				minWeight = entry.weight ;
				minWeightEntry = entry ;
			}
		}

		if ( ! minWeightEntry ) { break ; }

		changed = true ;
		recoverValue = value / minWeightEntry.weight ;

		if ( Math.abs( recoverValue ) <= Math.abs( minWeightEntry.value ) ) {
			// All the recover value is used
			minWeightEntry.value += recoverValue ;
			value = 0 ;
			break ;
		}

		// Only a part of recover value is used
		useFactor = Math.abs( minWeightEntry.value ) / Math.abs( recoverValue ) ;
		value *= 1 - useFactor ;
		minWeightEntry.value = 0 ;
	}

	if ( changed ) {
		arrayKit.inPlaceFilter( this.entries , e => e.value !== 0 ) ;
	}
} ;

