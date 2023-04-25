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
	An HistoryAlignometer is used to mesure things like good/evil alignment, tracking each good or bad action.
*/

function HistoryAlignometer( params = {} , parentTable = null , pathKey = null , clone = false ) {
	Stat.call( this , + params.base || 0 , parentTable , pathKey ) ;

	this.min = + params.min || 0 ;
	this.max = + params.max || 0 ;

	this.maxEntries = params.maxEntries ?? params['max-entries'] ;
	this.maxEntries = Number.isFinite( this.maxEntries ) && this.maxEntries > 0 ? this.maxEntries : 50 ;

	this.entries = Array.isArray( params.entries ) ? params.entries.map( e => ( e instanceof Entry ) && ! clone ? e : new Entry( e ) ) : [] ;

	this.minWeight = params.minWeight ?? params['min-weight'] ;
	this.minWeight = Number.isFinite( this.minWeight ) && this.minWeight > 0 ? this.minWeight : 20 ;

	this.instantMaxWeight = params.instantMaxWeight ?? params['instant-max-weight'] ;
	this.instantMaxWeight = Number.isFinite( this.instantMaxWeight ) && this.instantMaxWeight > 0 ? this.instantMaxWeight : 50 ;
}

HistoryAlignometer.prototype = Object.create( Stat.prototype ) ;
HistoryAlignometer.prototype.constructor = HistoryAlignometer ;

module.exports = HistoryAlignometer ;



HistoryAlignometer.prototype.proxyMethods = {
	add: 'add' ,
	toward: 'toward' ,
	upward: 'upward' ,
	downward: 'downward'
} ;

HistoryAlignometer.prototype.proxyProperties = {
	min: 'min' ,
	max: 'max' ,
	maxEntries: 'maxEntries' ,
	'max-entries': 'maxEntries' ,
	entries: 'entries' ,
	minWeight: 'minWeight' ,
	'min-weight': 'minWeight' ,
	instantMaxWeight: 'instantMaxWeight' ,
	'instant-max-weight': 'instantMaxWeight'
} ;

HistoryAlignometer.prototype.proxyWritableProperties = {
	min: 'min' ,
	max: 'max' ,
	maxEntries: 'maxEntries' ,
	'max-entries': 'maxEntries' ,
	minWeight: 'minWeight' ,
	'min-weight': 'minWeight' ,
	instantMaxWeight: 'instantMaxWeight' ,
	'instant-max-weight': 'instantMaxWeight'
} ;

HistoryAlignometer.prototype.proxyGetters = {
	instant: 'getInstant'
} ;

HistoryAlignometer.prototype.proxySetters = {} ;



HistoryAlignometer.prototype.clone = function( parentTable = this[ common.SYMBOL_PARENT ] , pathKey = this.pathKey ) {
	return new HistoryAlignometer( this , parentTable , pathKey , true ) ;
} ;



const ENTRY_VALUE_CONSTANTS = {
	full: 1 ,
	half: 0.5 ,
	neutral: 0 ,
	halfInverse: -0.5	// <- should find a better name here
} ;

const DIRECTION_CONSTANTS = {
	"1": 1 ,
	up: 1 ,
	"-1": -1 ,
	down: -1 ,
	both: 0
} ;



/*
	An entry is an object with those properties:
	* direction: if that entry improves or not the indicator, can be 1, 0, -1 or "up", "down", "both"
	* value: number, the target value of the entry
	* weight: number, the importance of the entry (default to 1)
	* description: string, optional
*/
function Entry( direction , value , weight , description ) {
	if ( direction && typeof direction === 'object' ) {
		( { direction , value , weight , description } = direction ) ;
	}

	this.direction = DIRECTION_CONSTANTS[ direction ] || 0 ;
	this.value = Number.isFinite( value ) ? value :
		! ENTRY_VALUE_CONSTANTS[ value ] ? 0 :
		ENTRY_VALUE_CONSTANTS[ value ] * this.direction ;
	this.weight = Number.isFinite( weight ) && weight > 0 ? weight : 1 ;
	this.description = typeof description === 'string' ? description : null ;
}

HistoryAlignometer.Entry = Entry ;



HistoryAlignometer.prototype.add = function( direction , value , weight , description ) {
	var entry ;

	if ( value instanceof Entry ) {
		entry = value ;
	}
	else {
		if ( value && typeof value === 'object' ) {
			( { direction , value , weight , description } = value ) ;
		}

		entry = new Entry( direction , value , weight , description ) ;
	}

	this.entries.push( entry ) ;

	if ( this.entries.length > this.maxEntries ) {
		this.entries = this.entries.splice( 0 , this.entries.length - this.maxEntries ) ;
	}
} ;



HistoryAlignometer.prototype.toward = function( value , weight , description ) { return this.add( 0 , value , weight , description ) ; } ;
HistoryAlignometer.prototype.upward = function( value , weight , description ) { return this.add( 1 , value , weight , description ) ; } ;
HistoryAlignometer.prototype.downward = function( value , weight , description ) { return this.add( -1 , value , weight , description ) ; } ;



HistoryAlignometer.prototype.getActual = function( pathKey = this.pathKey , weightLimit = Infinity ) {
	var i , upArray = [] , downArray = [] , entry , upEntry , downEntry , tmpActual , actual ,
		base = this.getBase() ,
		sum = 0 ,
		weightSum = 0 ,
		weightCount = 0 ;

	for ( i = this.entries.length - 1 ; i >= 0 && weightCount < weightLimit ; i -- ) {
		entry = this.entries[ i ] ;
		weightCount += entry.weight ;

		if ( weightCount > weightLimit ) {
			// Create an entry that don't surpass the limit
			entry = new Entry( entry ) ;
			entry.weight -= weightCount - weightLimit ;
			weightCount = weightLimit ;
		}

		if ( entry.direction === 1 ) {
			upArray.push( entry ) ;
		}
		else if ( entry.direction === -1 ) {
			downArray.push( entry ) ;
		}
		else {
			// Both direction, immediately add the value
			sum += entry.value * entry.weight ;
			weightSum += entry.weight ;
		}
	}

	// weight should at least be equal to minWeight, if not, we add the base value with the missing weight
	if ( weightCount < this.minWeight ) {
		let baseWeight = this.minWeight - weightCount ;
		sum += base * baseWeight ;
		weightSum += baseWeight ;
		//console.log( "Add base:" , base , baseWeight , "=>" , sum , weightSum ) ;
	}

	// From the weakest to the strongest (they are pop'ed from the array, so we really start with the strongest value to the weakest)
	upArray.sort( ( a , b ) => a.value - b.value ) ;
	downArray.sort( ( a , b ) => b.value - a.value ) ;
	//console.log( "up" , upArray , "\ndown" , downArray ) ;

	upEntry = upArray.pop() ;
	downEntry = downArray.pop() ;

	for ( ;; ) {
		// To have better precision, we reconstruct the average value from scratch every time,
		// instead of updating existing one (to avoid rounding error)
		tmpActual = sum ? sum / weightSum : 0 ;

		if ( upEntry && ( ! downEntry || upEntry.value - tmpActual >= tmpActual - downEntry.value ) ) {
			if ( tmpActual > upEntry.value ) { break ; }
			sum += upEntry.value * upEntry.weight ;
			weightSum += upEntry.weight ;
			//console.log( "Add up:" , upEntry.value , upEntry.weight , "=>" , sum , weightSum ) ;
			upEntry = upArray.pop() ;
		}
		else if ( downEntry && ( ! upEntry || upEntry.value - tmpActual <= tmpActual - downEntry.value ) ) {
			if ( downEntry.value > tmpActual ) { break ; }
			sum += downEntry.value * downEntry.weight ;
			weightSum += downEntry.weight ;
			//console.log( "Add down:" , downEntry.value , downEntry.weight , "=>" , sum , weightSum ) ;
			downEntry = downArray.pop() ;
		}
		else {
			break ;
		}
	}

	actual = sum ? sum / weightSum : 0 ;

	actual = this.computeModifiers( actual , base , pathKey ) ;
	actual = Math.max( this.min , Math.min( this.max , actual ) ) ;
	return actual ;
} ;



HistoryAlignometer.prototype.getInstant = function( pathKey = this.pathKey ) {
	return this.getActual( pathKey , this.instantMaxWeight ) ;
} ;

