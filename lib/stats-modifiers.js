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



const operators = require( './operators.js' ) ;
const compounds = require( './compounds.js' ) ;
const eventActions = require( './eventActions.js' ) ;
const arrayKit = require( 'array-kit' ) ;
const dotPath = require( 'tree-kit/lib/dotPath.js' ) ;

const extend = require( 'tree-kit/lib/extend.js' ) ;
const deepExtend = extend.bind( undefined , { deep: true , own: true } ) ;
const deepMaskExtend = extend.bind( undefined , { deep: true , own: true , mask: true } ) ;
const deepMask2Extend = extend.bind( undefined , { deep: true , own: true , mask: 2 } ) ;



const lib = {} ;
module.exports = lib ;



function StatsTable( stats = null , clone = false ) {
	this.stats = {} ;
	this.modifiersTables = [] ;	// list of modifiersTable of the StatsTable
	this.statsModifiers = {} ;	// per stat modifier list (key is a key path)
	this.proxy = null ;
	this.proxyToMeta = new Map() ;	// Store meta (path, isWild) for each nested proxies (used for wild card)
	this.pathToProxy = {} ;	// Key: path, value: proxy

	if ( stats ) { this.setStats( stats , clone ) ; }
}

lib.StatsTable = StatsTable ;



StatsTable.prototype.setStats = function( stats , clone = false ) {
	for ( let statName in stats ) { this.setStat( statName , stats[ statName ] , undefined , clone ) ; }
} ;



StatsTable.prototype.setStat = function( statName , params , pointer = this.stats , pathKey = null , clone = false ) {
	pathKey = pathKey ? pathKey + '.' + statName : statName ;

	if ( params === null ) {
		delete pointer[ statName ] ;
	}
	else if ( isPlainObjectOrArray( params ) && params.__prototypeUID__ !== 'kung-fig/Operator' && params.__prototypeUID__ !== 'kung-fig/Expression' && params.__prototypeUID__ !== 'kung-fig/Ref' ) {
		// Nested stats
		if (
			pointer[ statName ] && (
				( pointer[ statName ] instanceof Stat ) ||
				Array.isArray( params ) !== Array.isArray( pointer[ statName ] )
			)
		) {
			// Uncompatible: drop it (or error?)
			return ;
		}

		if ( Array.isArray( params ) ) {
			if ( ! pointer[ statName ] ) { pointer[ statName ] = [] ; }
			else { pointer[ statName ].length = 0 ; }	// erase the array, it doesn't make sense to set some index...
			params.forEach( ( element , index ) => this.setStat( index , element , pointer[ statName ] , pathKey , clone ) ) ;
		}
		else {
			if ( ! pointer[ statName ] ) { pointer[ statName ] = {} ; }
			Object.keys( params ).forEach( key => this.setStat( key , params[ key ] , pointer[ statName ] , pathKey , clone ) ) ;
		}
	}
	else {
		if ( pointer[ statName ] ) {
			if ( pointer[ statName ] instanceof Stat ) { pointer[ statName ].set( params ) ; }
			else { return ; }	// drop?
		}
		else {
			pointer[ statName ] = Stat.create( this , pathKey , params , clone ) ;
		}
	}
} ;



StatsTable.prototype.clone = function() {
	var statsTable = new StatsTable() ;
	statsTable.destClone_( this.stats , statsTable.stats ) ;
	return statsTable ;
} ;

StatsTable.prototype.cloneProxy = function() { return this.clone().getProxy() ; } ;



StatsTable.prototype.destClone_ = function( source , dest ) {
	var key ,
		keys = Array.isArray( source ) ? source.keys() : Object.keys( source ) ;

	for ( key of keys ) {
		if ( source[ key ] instanceof Stat ) {
			dest[ key ] = source[ key ].clone( this ) ;
		}
		else if ( Array.isArray( source[ key ] ) ) {
			dest[ key ] = [] ;
			this.destClone_( source[ key ] , dest[ key ] ) ;
		}
		else {
			dest[ key ] = {} ;
			this.destClone_( source[ key ] , dest[ key ] ) ;
		}
	}
} ;



// Clone then extend with stats
StatsTable.prototype.extend = function( stats ) {
	var statsTable = this.clone() ;
	statsTable.setStats( stats ) ;
	return statsTable ;
} ;

StatsTable.prototype.extendProxy = function( stats ) { return this.extend( stats ).getProxy() ; } ;



StatsTable.prototype.stack = function( modifiersTable ) {
	var statName , op , stat , modifier ;

	if ( modifiersTable[ SYMBOL_UNPROXY ] ) { modifiersTable = modifiersTable[ SYMBOL_UNPROXY ] ; }
	if ( ! ( modifiersTable instanceof ModifiersTable ) ) { throw new Error( 'Not a ModifiersTable' ) ; }

	if ( modifiersTable.isTemplate ) {
		modifiersTable = modifiersTable.instanciate() ;
	}
	else if ( modifiersTable.stackedOn ) {
		if ( modifiersTable.stackedOn !== this ) {
			// Is it an error?
			// Should we unstack it from the statsTable it is stacked on?
			// Should we just exit now?
			//return false ;
			modifiersTable.stackedOn.unstack( modifiersTable ) ;
		}
		else {
			return false ;
		}
	}

	modifiersTable.stackedOn = this ;
	this.modifiersTables.push( modifiersTable ) ;

	for ( statName in modifiersTable.statsModifiers ) {
		//stat = this.stats[ statName ] ;
		stat = dotPath.get( this.stats , statName ) ;
		if ( ! ( stat instanceof Stat ) ) { continue ; }

		for ( op in modifiersTable.statsModifiers[ statName ] ) {
			modifier = modifiersTable.statsModifiers[ statName ][ op ] ;
			stat.modifiers.push( modifier ) ;
		}

		stat.modifiers.sort( Modifier.sortFn ) ;
	}

	return true ;
} ;



StatsTable.prototype.unstack = function( modifiersTable ) {
	var index ;

	if ( modifiersTable[ SYMBOL_UNPROXY ] ) { modifiersTable = modifiersTable[ SYMBOL_UNPROXY ] ; }

	if ( modifiersTable instanceof ModifiersTable ) {
		index = this.modifiersTables.indexOf( modifiersTable ) ;
		if ( index === -1 ) { return ; }
		arrayKit.delete( this.modifiersTables , index ) ;
	}
	else if ( typeof modifiersTable === 'string' ) {
		// Delete by ID
		index = this.modifiersTables.findIndex( e => e.id === modifiersTable ) ;
		if ( index === -1 ) { return ; }
		modifiersTable = this.modifiersTables[ index ] ;
		arrayKit.delete( this.modifiersTables , index ) ;
	}

	this.afterUnstack( modifiersTable ) ;

	modifiersTable.stackedOn = null ;
} ;



StatsTable.prototype.afterUnstack = function( modifiersTable ) {
	var statName , op , stat , modifier ;

	for ( statName in modifiersTable.statsModifiers ) {
		//stat = this.stats[ statName ] ;
		stat = dotPath.get( this.stats , statName ) ;
		if ( ! ( stat instanceof Stat ) ) { continue ; }

		for ( op in modifiersTable.statsModifiers[ statName ] ) {
			modifier = modifiersTable.statsModifiers[ statName ][ op ] ;
			arrayKit.deleteValue( stat.modifiers , modifier ) ;
		}
	}
} ;



// Used for updates, when a ModifiersTable is changed (add one modifier)
StatsTable.prototype.addOneStatModifier = function( statName , modifier ) {
	//var stat = this.stats[ statName ] ;
	var stat = dotPath.get( this.stats , statName ) ;
	if ( ! ( stat instanceof Stat ) ) { return ; }
	stat.modifiers.push( modifier ) ;
	stat.modifiers.sort( Modifier.sortFn ) ;
} ;



// Trigger an event
StatsTable.prototype.trigger = function( eventName ) {
	this.modifiersTables.forEach( modifiersTable => modifiersTable.trigger( eventName ) ) ;
} ;



StatsTable.prototype.cleanModifiersTables = function() {
	var modifiersTable , index = 0 ;

	while ( index < this.modifiersTables.length ) {
		modifiersTable = this.modifiersTables[ index ] ;

		if ( modifiersTable.destroyed ) {
			arrayKit.delete( this.modifiersTables , index ) ;
			this.afterUnstack( modifiersTable ) ;
		}
		else {
			index ++ ;
		}
	}
} ;



StatsTable.prototype.getModifiersTables = function() {
	this.cleanModifiersTables() ;
	return this.modifiersTables ;
} ;



StatsTable.prototype.getModifiersTablesProxy = function() {
	var modifiersTable ,
		object = {} ;

	this.cleanModifiersTables() ;

	for ( modifiersTable of this.modifiersTables ) {
		object[ modifiersTable.id ] = modifiersTable.getProxy() ;
	}

	return object ;
} ;



StatsTable.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , STATS_TABLE_HANDLER ) ;
	return this.proxy ;
} ;



function Stat( base = null , parentTable = null , pathKey = null ) {
	this.parentTable = parentTable ;
	this.pathKey = pathKey ;
	this.base = base ;
	this.modifiers = [] ;
	this.constraints = null ;	// TODO?
	this.proxy = null ;
}

lib.Stat = Stat ;

Stat.prototype.proxyMethods = {} ;
Stat.prototype.proxyProperties = {} ;
Stat.prototype.proxyWritableProperties = {} ;



Stat.create = function( parentTable , pathKey , params , clone ) {
	var stat ;

	if ( ! params || typeof params !== 'object' ) { return new Stat( params , parentTable , pathKey ) ; }

	// First, unproxy it if necessary
	if ( params[ SYMBOL_UNPROXY ] ) { params = params[ SYMBOL_UNPROXY ] ; }

	// Stat and all derivated
	if ( params instanceof Stat ) {
		if ( clone ) { return params.clone( parentTable , pathKey ) ; }
		params.parentTable = parentTable ;
		params.pathKey = pathKey ;
		return params ;
	}

	if ( params.__prototypeUID__ === 'kung-fig/Operator' ) {
		return new CompoundStat( params.operator , params.operand , parentTable , pathKey ) ;
	}

	if ( params.__prototypeUID__ === 'kung-fig/Expression' || params.__prototypeUID__ === 'kung-fig/Ref' ) {
		return new CompoundStat( params , parentTable , pathKey ) ;
	}

	// Considered as immutable object
	if ( ! isPlainObjectOrArray( params ) ) { return new Stat( params , parentTable , pathKey ) ; }

	throw new Error( "Stat.create(): bad parameters" ) ;
} ;



Stat.prototype.clone = function( parentTable = this.parentTable , pathKey = this.pathKey ) {
	return new Stat( this.base , parentTable , pathKey ) ;
} ;

// ...args is for derivated class
Stat.prototype.cloneProxy = function( ... args ) { return this.clone( ... args ).getProxy() ; } ;

// For instance, there is no difference between .set() and .setBase(), but this may change in the future
Stat.prototype.set =
Stat.prototype.setBase = function( base ) { this.base = base ; } ;
Stat.prototype.getBase = function() { return this.base ; } ;
Stat.prototype.getActual = function() { return this.computeModifiers( this.base , this.base ) ; } ;



Stat.prototype.computeModifiers = function( actual , base ) {
	// It should be already sorted, since it's sorted on insertion
	for ( let modifier of this.modifiers ) {
		if ( modifier.active ) { actual = modifier.apply( actual , base ) ; }
	}

	return actual ;
} ;



Stat.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , STAT_HANDLER ) ;
	return this.proxy ;
} ;



function CompoundStat( arg1 , arg2 , parentTable , pathKey ) {
	if ( arg2 instanceof StatsTable ) {
		pathKey = parentTable ;
		parentTable = arg2 ;
	}

	Stat.call( this , undefined , parentTable , pathKey ) ;

	this.baseFn = null ;
	this.actualFn = null ;
	this.statNames = null ;
	this.isBuiltin = true ;

	if ( typeof arg1 === 'string' ) {
		if ( ! compounds[ arg1 ] ) { throw new Error( "Unknown compound operator '" + arg1 + "'" ) ; }
		this.baseFn = this.actualFn = compounds[ arg1 ] ;
		this.statNames = Array.isArray( arg2 ) ? arg2 : [ arg2 ] ;
	}
	else if ( typeof arg1 === 'function' && typeof arg2 === 'function' ) {
		this.baseFn = arg1 ;
		this.actualFn = arg2 ;
		this.isBuiltin = false ;
	}
	else if ( arg1?.__prototypeUID__ === 'kung-fig/Expression' ) {
		this.baseFn = CompoundStat.expressionToFn( arg1 , 'base' ) ;
		this.actualFn = CompoundStat.expressionToFn( arg1 , 'actual' ) ;
		this.isBuiltin = false ;
	}
	else if ( arg1?.__prototypeUID__ === 'kung-fig/Ref' ) {
		this.baseFn = CompoundStat.refToFn( arg1 , 'base' ) ;
		this.actualFn = CompoundStat.refToFn( arg1 , 'actual' ) ;
		this.isBuiltin = false ;
	}
	else {
		throw new Error( "CompoundStat: bad operator type" ) ;
	}
}

CompoundStat.prototype = Object.create( Stat.prototype ) ;
CompoundStat.prototype.constructor = CompoundStat ;

lib.CompoundStat = CompoundStat ;

CompoundStat.prototype.proxyMethods = {} ;
CompoundStat.prototype.proxyProperties = {} ;
CompoundStat.prototype.proxyWritableProperties = {} ;



CompoundStat.prototype.clone = function( parentTable = this.parentTable , pathKey = this.pathKey ) {
	return this.isBuiltin ?
		new CompoundStat( this.actualFn.id , [ ... this.statNames ] , parentTable , pathKey ) :
		new CompoundStat( this.baseFn , this.actualFn , parentTable , pathKey ) ;
} ;



CompoundStat.prototype.getBase = function() {
	if ( this.isBuiltin ) {
		return this.baseFn( this.statNames.map( statName => {
			var stat = dotPath.get( this.parentTable.stats , statName ) ;
			return stat instanceof Stat ? stat.getBase() : null ;
		} ) ) ;
	}

	return this.baseFn( this.parentTable.getProxy() ) ;
} ;



CompoundStat.prototype.getActual = function() {
	var actual ,
		base = this.getBase() ;

	if ( this.isBuiltin ) {
		actual = this.actualFn( this.statNames.map( statName => {
			var stat = dotPath.get( this.parentTable.stats , statName ) ;
			return stat instanceof Stat ? stat.getActual() : null ;
		} ) ) ;
	}
	else {
		actual = this.actualFn( this.parentTable.getProxy() ) ;
	}

	return this.computeModifiers( actual , base ) ;
} ;



// Patch Kung Fig expression, to append .actual to each ref
CompoundStat.patchExpressionRef = function( expression , suffix ) {
	for ( let arg of expression.args ) {
		if ( arg && typeof arg === 'object' ) {
			if ( arg.__prototypeUID__ === 'kung-fig/Ref' ) { arg.appendPart( suffix ) ; }
			else if ( arg.__prototypeUID__ === 'kung-fig/Expression' ) { CompoundStat.patchExpressionRef( arg , suffix ) ; }
		}
	}
} ;



CompoundStat.expressionToFn = function( expression , suffix = null ) {
	// Do not modify the original Expression, coming from the KFG
	if ( suffix ) {
		expression = expression.clone() ;
		CompoundStat.patchExpressionRef( expression , suffix ) ;
	}

	return expression.compile() ;
} ;



CompoundStat.refToFn = function( ref_ , suffix = null ) {
	// Do not modify the original Expression, coming from the KFG
	if ( suffix ) {
		ref_ = ref_.clone() ;
		ref_.appendPart( suffix ) ;
	}

	return ref_.compile() ;
} ;



// A Gauge is used for simple gauge like hit points.

function Gauge( params = {} , parentTable = null , pathKey = null , clone = false ) {
	Stat.call( this , + params.base || 0 , parentTable , pathKey ) ;

	this.min = + params.min || 0 ;
	this.max = + params.max || 0 ;

	this.maxEntries = params.maxEntries ?? params['max-entries'] ;
	this.maxEntries = Number.isFinite( this.maxEntries ) && this.maxEntries > 0 ? this.maxEntries : Infinity ;

	this.entries = Array.isArray( params.entries ) ? params.entries.map( e => ( e instanceof GaugeEntry ) && ! clone ? e : new GaugeEntry( e ) ) : [] ;
}

Gauge.prototype = Object.create( Stat.prototype ) ;
Gauge.prototype.constructor = Gauge ;

lib.Gauge = Gauge ;

Gauge.prototype.proxyMethods = {
	add: 'add' ,
	addMerge: 'addMerge' ,
	'add-merge': 'addMerge' ,
	recover: 'recover'
} ;

Gauge.prototype.proxyProperties = {
	min: 'min' ,
	max: 'max' ,
	maxEntries: 'maxEntries' ,
	'max-entries': 'maxEntries' ,
	entries: 'entries'
} ;

Gauge.prototype.proxyWritableProperties = {
	min: 'min' ,
	max: 'max' ,
	maxEntries: 'maxEntries' ,
	'max-entries': 'maxEntries'
} ;



Gauge.prototype.clone = function( parentTable = this.parentTable , pathKey = this.pathKey ) {
	return new Gauge( this , parentTable , pathKey , true ) ;
} ;



/*
	An entry is an object with those properties:
	* value: any real number (usually between -1 and 1), that will modify the gauge
	* weight: not directly used, but userland can use it for use case like hit point recovery
	* description: string, optional
*/
function GaugeEntry( value , weight , description ) {
	// Change here should be reflected in Gauge#addMerge()
	if ( value && typeof value === 'object' ) {
		( { value , weight , description } = value ) ;
	}

	this.value = + value || 0 ;
	this.weight = Number.isFinite( weight ) && weight > 0 ? weight : 1 ;
	this.description = typeof description === 'string' ? description : null ;
}

lib.GaugeEntry = GaugeEntry ;



Gauge.prototype.add = function( value , weight , description ) {
	var entry ;

	if ( value instanceof GaugeEntry ) {
		entry = value ;
	}
	else {
		if ( value && typeof value === 'object' ) {
			( { value , weight , description } = value ) ;
		}

		if ( ! value ) { return ; }
		entry = new GaugeEntry( value , weight , description ) ;
	}

	this.entries.push( entry ) ;

	if ( this.entries.length > this.maxEntries ) {
		this.entries = this.entries.splice( 0 , this.entries.length - this.maxEntries ) ;
	}
} ;



Gauge.prototype.addMerge = function( value , weight , description ) {
	// Same argument management than GaugeEntry constructor
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



Gauge.prototype.getActual = function() {
	var base = this.getBase() ,
		actual = this.entries.reduce( ( accumulator , entry ) => accumulator + entry.value , base ) ;

	actual = this.computeModifiers( actual , base ) ;
	actual = Math.max( this.min , Math.min( this.max , actual ) ) ;
	return actual ;
} ;



Gauge.prototype.recover = function( value ) {
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



// An Alignometer can mesure things like good/evil alignment.

function Alignometer( params = {} , parentTable = null , pathKey = null , clone = false ) {
	Stat.call( this , + params.base || 0 , parentTable , pathKey ) ;

	this.min = + params.min || 0 ;
	this.max = + params.max || 0 ;

	this.maxEntries = params.maxEntries ?? params['max-entries'] ;
	this.maxEntries = Number.isFinite( this.maxEntries ) && this.maxEntries > 0 ? this.maxEntries : 50 ;

	this.entries = Array.isArray( params.entries ) ? params.entries.map( e => ( e instanceof AlignometerEntry ) && ! clone ? e : new AlignometerEntry( e ) ) : [] ;

	this.minWeight = params.minWeight ?? params['min-weight'] ;
	this.minWeight = Number.isFinite( this.minWeight ) && this.minWeight > 0 ? this.minWeight : 20 ;

	this.instantMaxWeight = params.instantMaxWeight ?? params['instant-max-weight'] ;
	this.instantMaxWeight = Number.isFinite( this.instantMaxWeight ) && this.instantMaxWeight > 0 ? this.instantMaxWeight : 50 ;
}

Alignometer.prototype = Object.create( Stat.prototype ) ;
Alignometer.prototype.constructor = Alignometer ;

lib.Alignometer = Alignometer ;

Alignometer.prototype.proxyMethods = {
	add: 'add' ,
	toward: 'toward' ,
	upward: 'upward' ,
	downward: 'downward'
} ;

Alignometer.prototype.proxyProperties = {
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

Alignometer.prototype.proxyWritableProperties = {
	min: 'min' ,
	max: 'max' ,
	maxEntries: 'maxEntries' ,
	'max-entries': 'maxEntries' ,
	minWeight: 'minWeight' ,
	'min-weight': 'minWeight' ,
	instantMaxWeight: 'instantMaxWeight' ,
	'instant-max-weight': 'instantMaxWeight'
} ;



Alignometer.prototype.clone = function( parentTable = this.parentTable , pathKey = this.pathKey ) {
	return new Alignometer( this , parentTable , pathKey , true ) ;
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
function AlignometerEntry( direction , value , weight , description ) {
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

lib.AlignometerEntry = AlignometerEntry ;



Alignometer.prototype.add = function( direction , value , weight , description ) {
	var entry ;

	if ( value instanceof AlignometerEntry ) {
		entry = value ;
	}
	else {
		if ( value && typeof value === 'object' ) {
			( { direction , value , weight , description } = value ) ;
		}

		entry = new AlignometerEntry( direction , value , weight , description ) ;
	}

	this.entries.push( entry ) ;

	if ( this.entries.length > this.maxEntries ) {
		this.entries = this.entries.splice( 0 , this.entries.length - this.maxEntries ) ;
	}
} ;



Alignometer.prototype.toward = function( value , weight , description ) { return this.add( 0 , value , weight , description ) ; } ;
Alignometer.prototype.upward = function( value , weight , description ) { return this.add( 1 , value , weight , description ) ; } ;
Alignometer.prototype.downward = function( value , weight , description ) { return this.add( -1 , value , weight , description ) ; } ;



Alignometer.prototype.getActual = function( weightLimit = Infinity ) {
	var i , upArray = [] , downArray = [] , entry , upEntry , downEntry , tmpActual , actual ,
		base = this.getBase() ,
		sum = 0 ,
		weightSum = 0 ,
		weightCount = 0 ;

	for ( i = this.entries.length - 1 ; i >= 0 && weightSum < weightLimit ; i -- ) {
		entry = this.entries[ i ] ;
		weightCount += entry.weight ;

		if ( weightCount > weightLimit ) {
			// Create an entry that don't surpass the limit
			entry = new AlignometerEntry( entry ) ;
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
	//console.log( "up" , upArray , "down" , downArray ) ;

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

	actual = this.computeModifiers( actual , base ) ;
	actual = Math.max( this.min , Math.min( this.max , actual ) ) ;
	return actual ;
} ;



Alignometer.prototype.getInstant = function() {
	return this.getActual( this.instantMaxWeight ) ;
} ;



function ModifiersTable( id , statsModifiers = null , active = true , isTemplate = false , events = null ) {
	this.id = id ;
	this.statsModifiers = {} ;	// per-stat modifier
	this.active = !! active ;
	this.destroyed = false ;
	this.stackedOn = null ;				// can be stacked on only one stats table
	this.isTemplate = !! isTemplate ;	// templates are cloned before been stacked
	this.templateInstanceCount = 0 ;
	this.events = {} ;

	this.proxy = null ;

	if ( statsModifiers ) {
		for ( let statName in statsModifiers ) { this.setStatModifiers( statName , statsModifiers[ statName ] ) ; }
	}

	if ( Array.isArray( events ) ) {
		for ( let event of events ) {
			if ( event && typeof event === 'object' ) { this.setEvent( event ) ; }
		}
	}
}

lib.ModifiersTable = ModifiersTable ;



ModifiersTable.prototype.setStatModifiers = function( statName , modifiers ) {
	if ( this.destroyed ) { return ; }

	if ( isPlainObject( modifiers ) && modifiers.__prototypeUID__ !== 'kung-fig/Operator' ) {
		// Nested object syntax
		for ( let key in modifiers ) {
			this.setStatModifiers( statName + '.' + key , modifiers[ key ] ) ;
		}

		return ;
	}

	// Check for the mono-modifier syntax, enclose it inside an array
	if ( ! Array.isArray( modifiers ) ) { modifiers = [ modifiers ] ; }
	else if ( ! modifiers[ 0 ] || typeof modifiers[ 0 ] !== 'object' ) { modifiers = [ modifiers ] ; }

	if ( ! this.statsModifiers[ statName ] ) { this.statsModifiers[ statName ] = {} ; }

	for ( let modifier of modifiers ) {
		if ( modifier && typeof modifier === 'object' ) {
			// There is the “classic” array syntax, and the object syntax (later is used by the KFG operator syntax)
			if ( Array.isArray( modifier ) ) { this.setStatModifier( statName , ... modifier ) ; }
			else if ( ! modifier.operator || modifier.operand === undefined ) { throw new Error( "Modifier without an operator or operand key" ) ; }
			else { this.setStatModifier( statName , modifier.operator , modifier.operand , modifier.priorityGroup ) ; }
		}
	}
} ;



ModifiersTable.prototype.setStatModifier = function( statName , operator , operand , priorityGroup = null ) {
	if ( this.destroyed ) { return ; }

	var canonicalOperator , key ,
		ops = this.statsModifiers[ statName ] ;

	if ( ! operators[ operator ] ) { throw new Error( "Unknown operator '" + operator + "'" ) ; }

	if ( operators[ operator ].convert ) {
		operand = operators[ operator ]( operand ) ;
		operator = operators[ operator ].convert ;
	}

	key = canonicalOperator = operators[ operator ].id ;
	if ( priorityGroup !== null && priorityGroup !== operators[ operator ].priorityGroup ) {
		key += priorityGroup ;
	}

	if ( ops[ key ] ) {
		ops[ key ].merge( operand ) ;
	}
	else {
		ops[ key ] = new Modifier( this.id , canonicalOperator , operand , priorityGroup , this.active ) ;

		if ( this.stackedOn ) {
			this.stackedOn.addOneStatModifier( statName , ops[ key ] ) ;
		}
	}
} ;



// 'changeId' falsy: don't change ID, true: create a new id from current, any other truthy: the new ID
ModifiersTable.prototype.clone = function( changeId = true ) {
	return new ModifiersTable(
		! changeId ? this.id  :  changeId === true ? lib.createCloneId( this.id )  :  changeId  ,
		null ,
		this.active ,
		this.isTemplate
	).extend( this ) ;
} ;

ModifiersTable.prototype.cloneProxy = function( changeId ) { return this.clone( changeId ).getProxy() ; } ;



// If fromCloneId is set, we want to clone rather than instanciate a template, but since this share a lot of code...
ModifiersTable.prototype.instanciate = function() {
	if ( ! this.isTemplate ) { return this ; }	// /!\ or error???
	return new ModifiersTable( this.id + '_' + ( this.templateInstanceCount ++ ) , null , this.active , false ).extend( this ) ;
} ;



// Extend the current modifiers table with another
ModifiersTable.prototype.extend = function( withModifiersTable ) {
	var statName , modifiers , eventName ;

	for ( statName in withModifiersTable.statsModifiers ) {
		modifiers = Object.values( withModifiersTable.statsModifiers[ statName ] ).map( e => [ e.operator , e.operand , e.priorityGroup ] ) ;
		this.setStatModifiers( statName , modifiers ) ;
	}

	for ( eventName in withModifiersTable.events ) {
		withModifiersTable.events[ eventName ].forEach( event => this.setEvent_( eventName , event.times , event.every , event.action , event.params ) ) ;
	}

	return this ;
} ;



ModifiersTable.prototype.destroy = function() {
	this.activate( false ) ;
	this.destroyed = true ;
} ;



ModifiersTable.prototype.deactivate = function() { return this.activate( false ) ; } ;
ModifiersTable.prototype.activate = function( active = true ) {
	if ( this.destroyed ) { return ; }

	active = !! active ;
	if ( active === this.active ) { return ; }
	this.active = active ;

	for ( let statName in this.statsModifiers ) {
		for ( let operator in this.statsModifiers[ statName ] ) {
			this.statsModifiers[ statName ][ operator ].active = this.active ;
		}
	}
} ;



const EVENT_RESERVED_KEYS = new Set( [ 'name' , 'times' , 'every' , 'action' , 'params' ] ) ;

ModifiersTable.prototype.setRecurringEvent = function( eventName , action , params ) { return this.setEvent_( eventName , Infinity , 1 , action , params ) ; } ;
ModifiersTable.prototype.setOneTimeEvent = function( eventName , action , params ) { return this.setEvent_( eventName , 1 , 1 , action , params ) ; } ;
ModifiersTable.prototype.setEveryEvent = function( eventName , every , action , params ) { return this.setEvent_( eventName , Infinity , every , action , params ) ; } ;
ModifiersTable.prototype.setCountdownEvent = function( eventName , countdown , action , params ) { return this.setEvent_( eventName , 1 , countdown , action , params ) ; } ;

// Mainly for KFG
ModifiersTable.prototype.setEvent = function( event ) {
	var params = null ;

	if ( ! event || typeof event !== 'object' ) { return ; }

	if ( event.params && typeof event.params === 'object' ) {
		params = event.params ;
	}
	else {
		// The params could be embedded on the top-level object (KFG shorthand syntax)
		for ( let key in event ) {
			if ( ! EVENT_RESERVED_KEYS.has( key ) ) {
				if ( ! params ) { params = {} ; }
				params[ key ] = event[ key ] ;
			}
		}
	}

	return this.setEvent_(
		event.name || '' ,
		event.times !== undefined ? + event.times || 0 : Infinity ,
		event.every !== undefined ? + event.every || 0 : 1 ,
		event.action || '' ,
		params
	) ;
} ;

/*
	action: the function ID
	times: how many times the event occurs
	every: triggered only every X eventName
*/
ModifiersTable.prototype.setEvent_ = function( eventName , times , every , action , params ) {
	if ( ! eventActions[ action ] ) { return ; }
	if ( ! this.events[ eventName ] ) { this.events[ eventName ] = [] ; }
	this.events[ eventName ].push( {
		action , times , every , params , count: 0 , done: false
	} ) ;
} ;



// Trigger an event
ModifiersTable.prototype.trigger = function( eventName ) {
	if ( this.destroyed ) { return ; }

	var deleteNeeded = false ,
		events = this.events[ eventName ] ;

	if ( ! events || ! events.length ) { return ; }

	events.forEach( eventData => {
		// If the action recursively trigger a .trigger(), we need to check for eventData.done now
		if ( eventData.done ) { deleteNeeded = true ; return ; }

		eventData.count ++ ;
		if ( eventData.count % eventData.every !== 0 ) { return ; }
		if ( eventData.count / eventData.every >= eventData.times ) { eventData.done = true ; }

		eventActions[ eventData.action ]( this , eventData , eventData.params ) ;

		// Should be added after the actionFn, because it can set it to done (e.g.: fade)
		if ( eventData.done ) { deleteNeeded = true ; }
	} ) ;

	if ( deleteNeeded ) {
		//arrayKit.inPlaceFilter( events , eventData => eventData.countdown === null || eventData.countdown > 0 ) ;
		arrayKit.inPlaceFilter( events , eventData => ! eventData.done ) ;
	}
} ;



ModifiersTable.prototype.forEachModifier = function( fn ) {
	var statName , op ;

	for ( statName in this.statsModifiers ) {
		for ( op in this.statsModifiers[ statName ] ) {
			fn( this.statsModifiers[ statName ][ op ] , statName ) ;
		}
	}
} ;



ModifiersTable.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , MODIFIERS_TABLE_HANDLER ) ;
	return this.proxy ;
} ;



function Modifier( id , operator , operand , priorityGroup = null , active = true ) {
	if ( ! operators[ operator ] ) { throw new Error( "Unknown operator '" + operator + "'" ) ; }

	if ( operators[ operator ].convert ) {
		operand = operators[ operator ]( operand ) ;
		operator = operators[ operator ].convert ;
	}

	this.id = id ;
	this.fn = operators[ operator ] ;	// operator function
	this.operator = this.fn.id ;	// operator identifier
	this.operand = operand ;
	this.priorityGroup = priorityGroup === null ? this.fn.priorityGroup : priorityGroup ;
	this.active = !! active ;
	this.proxy = null ;
}

lib.Modifier = Modifier ;



Modifier.sortFn = ( a , b ) => b.priorityGroup - a.priorityGroup || b.fn.priority - a.fn.priority ;



Modifier.prototype.merge = function( operand ) {
	this.operand = this.fn.merge( this.operand , operand ) ;
} ;



Modifier.prototype.set =
Modifier.prototype.setOperand = function( operand ) {
	this.operand = operand ;
} ;



Modifier.prototype.apply = function( existingValue , base ) {
	return this.fn( existingValue , this.operand , base ) ;
} ;



Modifier.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , MODIFIER_HANDLER ) ;
	return this.proxy ;
} ;



// Utilities...



const cloneRegexp = /_clone_[0-9]+/ ;
var cloneAutoId = 0 ;

lib.createCloneId = id => {
	if ( id.match( cloneRegexp ) ) {
		return id.replace( cloneRegexp , '_clone_' + ( cloneAutoId ++ ) ) ;
	}

	return id + '_clone_' + ( cloneAutoId ++ ) ;
} ;

// Unit test only
lib.unitTestResetCloneId = () => cloneAutoId = 0 ;

function isPlainObject( value ) {
	if ( ! value || typeof value !== 'object' ) { return false ; }
	var proto = Object.getPrototypeOf( value ) ;
	if ( proto === Object.prototype || proto === null ) { return true ; }
	return false ;
}

function isPlainObjectOrArray( value ) {
	if ( ! value || typeof value !== 'object' ) { return false ; }
	if ( Array.isArray( value ) ) { return true ; }
	var proto = Object.getPrototypeOf( value ) ;
	if ( proto === Object.prototype || proto === null ) { return true ; }
	return false ;
}



// Proxy handlers



// Because it is only used on controlled internal stuffs:
/* eslint-disable no-prototype-builtins */

//const SYMBOL_ID = Symbol( 'id' ) ;
const SYMBOL_PARENT = Symbol( 'parent' ) ;
const SYMBOL_STAT_NAME = Symbol( 'statName' ) ;
const SYMBOL_STAT_PATH = Symbol( 'statPath' ) ;
const SYMBOL_PROXY = Symbol( 'proxy' ) ;
const SYMBOL_WILD_PROXY = Symbol( 'wildProxy' ) ;
const SYMBOL_UNPROXY = lib.UNPROXY = Symbol( 'unproxy' ) ;

const STATS_TABLE_PROXY_METHODS = new Set( [ 'setStat' , 'stack' , 'unstack' , 'trigger' ] ) ;

const STATS_TABLE_HANDLER = {
	get: ( statsTable , property , receiver ) => {
		if ( property === SYMBOL_UNPROXY ) { return statsTable ; }
		if ( property === 'constructor' ) { return StatsTable ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return statsTable.cloneProxy.bind( statsTable ) ; }
		if ( property === 'extend' ) { return statsTable.extendProxy.bind( statsTable ) ; }

		if ( STATS_TABLE_PROXY_METHODS.has( property ) ) {
			//return Reflect.get( statsTable , property , receiver ) ;	// Don't work, not bounded
			return statsTable[ property ].bind( statsTable ) ;
		}

		if ( property === 'modifiersTables' || property === 'mods' ) {
			return statsTable.getModifiersTablesProxy() ;
		}

		var targetProxy ,
			target = statsTable.stats ,
			targetValue = target[ property ] ,
			targetPath = property ;

		if ( targetValue && typeof targetValue === 'object' ) {
			targetProxy = statsTable.pathToProxy[ targetPath ] ;
			if ( targetProxy ) { return targetProxy ; }

			targetValue[ SYMBOL_PARENT ] = statsTable ;

			targetProxy = new Proxy(
				targetValue ,
				targetValue instanceof Stat ? STAT_HANDLER : INTERMEDIATE_STATS_TABLE_HANDLER
			) ;

			statsTable.pathToProxy[ targetPath ] = targetProxy ;
			statsTable.proxyToMeta.set( targetProxy , {
				path: targetPath ,
				isWild: false
			} ) ;
			
			return targetProxy ;
		}

		return ;
	} ,
	set: ( target , property , value , receiver ) => {
		if ( STATS_TABLE_PROXY_METHODS.has( property ) ) { return false ; }

		if ( target.stats[ property ] ) {
			target.stats[ property ].set( value ) ;
			return true ;
		}

		return false ;
	} ,

	ownKeys: ( target ) => [ 'mods' , ... Object.keys( target.stats ) ] ,
	getOwnPropertyDescriptor: ( target , property ) => {
		// configurable:true is forced by Proxy Invariants
		if ( property === 'modifiersTables' || property === 'mods' || target.stats[ property ] ) {
			return { value: STATS_TABLE_HANDLER.get( target , property , target ) , configurable: true } ;
		}
	}
} ;



// Proxy for the .statsModifiers[ key ] objects
const INTERMEDIATE_STATS_TABLE_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return Object ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }

		var targetProxy ,
			isWild = false ,
			targetValue = target[ property ] ,
			statsTable = target[ SYMBOL_PARENT ] ,
			receiverMeta = statsTable.proxyToMeta.get( receiver ) ,
			targetPath = receiverMeta.path + '.' + property ;

		if ( targetValue === undefined && target['*'] ) {
			if ( ! statsTable.statsModifiers[ receiverMeta.path ] || ! statsTable.statsModifiers[ receiverMeta.path ].has( property ) ) {
				// It doesn't have any modifiers that added that key, so exit now!
				return ;
			}

			// Change the target for the wildCard
			targetValue = target['*'] ;
			isWild = true ;
		}

		if ( targetValue && typeof targetValue === 'object' ) {
			targetProxy = statsTable.pathToProxy[ targetPath ] ;
			if ( targetProxy ) { return targetProxy ; }

			if ( targetValue instanceof Stat ) {
				targetProxy = new Proxy( targetValue , STAT_HANDLER ) ;
			}
			else {
				targetValue[ SYMBOL_PARENT ] = statsTable ;
				targetProxy = new Proxy( targetValue , INTERMEDIATE_STATS_TABLE_HANDLER ) ;
			}

			statsTable.pathToProxy[ targetPath ] = targetProxy ;
			statsTable.proxyToMeta.set( targetProxy , {
				path: targetPath ,
				isWild: receiverMeta.isWild || isWild
			} ) ;
			
			console.log( "intermediate stat get:" , targetPath ) ;
			return targetProxy ;
		}

		return Reflect.get( target , property , receiver ) ;
	}
	//set: ( target , property , value , receiver ) => {}
} ;



const STAT_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return Stat ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return target.cloneProxy.bind( target ) ; }

		if ( target.proxyMethods.hasOwnProperty( property ) ) {
			return target[ target.proxyMethods[ property ] ].bind( target ) ;
		}

		if ( target.proxyProperties.hasOwnProperty( property ) ) {
			return target[ target.proxyProperties[ property ] ] ;
		}

		var receiverMeta = target.parentTable.proxyToMeta.get( receiver ) ;
		console.log( "stat get:" , receiverMeta.path ) ;

		if ( property === 'base' ) { return target.getBase() ; }
		if ( property === 'actual' ) { return target.getActual() ; }
		if ( property === 'instant' && typeof target.getInstant === 'function' ) { return target.getInstant() ; }

		//if ( STAT_PROXY_LOCAL.has( property ) ) { return Reflect.get( target , property , receiver ) ; }

		return ;
	} ,
	set: ( target , property , value , receiver ) => {
		if ( target.proxyWritableProperties[ property ] ) {
			//return Reflect.set( target , target.proxyWritableProperties[ property ] , value , receiver ) ;
			target[ target.proxyProperties[ property ] ] = value ;
			return true ;
		}

		if ( property === 'base' ) {
			target.setBase( value ) ;
			return true ;
		}

		//if ( STAT_PROXY_METHODS.has( property ) ) { return false ; }
		//if ( property === 'actual' ) { return false ; }

		return false ;
	} ,
	ownKeys: ( target ) => typeof target.getInstant === 'function' ?
		[ 'base' , 'actual' , 'instant' , ... Object.keys( target.proxyProperties ) ] :
		[ 'base' , 'actual' , ... Object.keys( target.proxyProperties ) ]
	,
	getOwnPropertyDescriptor: ( target , property ) => {
		// configurable:true is forced by Proxy Invariants
		if ( target.proxyProperties[ property ] ) {
			return { value: STAT_HANDLER.get( target , target.proxyProperties[ property ] , target ) , writable: true , configurable: true } ;
		}

		if ( property === 'base' || property === 'actual' || ( property === 'instant' && typeof target.getInstant === 'function' ) ) {
			return { value: STAT_HANDLER.get( target , property , target ) , configurable: true } ;
		}
	}
} ;



const MODIFIERS_TABLE_PROXY_METHODS = new Set( [ 'setStatModifiers' , 'trigger' ] ) ;

const MODIFIERS_TABLE_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return ModifiersTable ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return target.cloneProxy.bind( target ) ; }

		if ( MODIFIERS_TABLE_PROXY_METHODS.has( property ) ) {
			//return Reflect.get( target , property , receiver ) ;	// Don't work, not bounded
			return target[ property ].bind( target ) ;
		}

		if ( target.statsModifiers[ property ] ) {
			let modifiers = target.statsModifiers[ property ] ;
			if ( modifiers[ SYMBOL_PROXY ] ) { return modifiers[ SYMBOL_PROXY ] ; }
			modifiers[ SYMBOL_PARENT ] = target ;
			modifiers[ SYMBOL_STAT_NAME ] = property ;
			return modifiers[ SYMBOL_PROXY ] = new Proxy( modifiers , INTERMEDIATE_MODIFIERS_TABLE_HANDLER ) ;
		}

		return ;
	} ,

	ownKeys: ( target ) => [ ... Object.keys( target.statsModifiers ) ] ,
	getOwnPropertyDescriptor: ( target , property ) => {
		// configurable:true is forced by Proxy Invariants
		if ( target.statsModifiers[ property ] ) {
			return { value: MODIFIERS_TABLE_HANDLER.get( target , property , target ) , configurable: true } ;
		}
	}
} ;



// Proxy for the .statsModifiers[ key ] objects
const INTERMEDIATE_MODIFIERS_TABLE_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return Object ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }

		var targetValue = target[ property ] ;

		if ( targetValue && typeof targetValue === 'object' ) {
			return targetValue.getProxy() ;
		}

		return Reflect.get( target , property , receiver ) ;
	} ,
	set: ( target , property , value , receiver ) => {
		var targetValue = target[ property ] ;

		if ( targetValue && typeof targetValue === 'object' ) {
			if ( ! value || typeof value !== 'object' ) {
				targetValue.set( value ) ;
				return true ;
			}
		}

		if ( targetValue === undefined ) {
			let match = property.match( /^([a-zA-Z_]+)([0-9]*)$/ ) ;
			if ( ! match ) { return false ; }

			let parent = target[ SYMBOL_PARENT ] ,
				statName = target[ SYMBOL_STAT_NAME ] ,
				operator = match[ 1 ] ,
				priorityGroup = + match[ 2 ] ;




			// /!\ Is it OK? It seems wrong to use statName instead of statPath

			parent.setStatModifier( statName , operator , value , priorityGroup ) ;




			return true ;
		}

		return false ;
	}
} ;



const MODIFIER_PROXY_METHODS = new Set( [ 'merge' ] ) ;
const MODIFIER_PROXY_LOCAL = new Set( [ 'id' , 'operator' , 'operand' , 'priorityGroup' , 'active' ] ) ;

const MODIFIER_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return Modifier ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }

		if ( MODIFIER_PROXY_METHODS.has( property ) ) {
			//return Reflect.get( target , property , receiver ) ;	// Don't work, not bounded
			return target[ property ].bind( target ) ;
		}

		if ( MODIFIER_PROXY_LOCAL.has( property ) ) {
			return Reflect.get( target , property , receiver ) ;
		}

		return ;
	} ,
	set: ( target , property , value , receiver ) => {
		if ( MODIFIER_PROXY_METHODS.has( property ) ) { return false ; }

		if ( property === 'operand' ) {
			target.setOperand( value ) ;
			return true ;
		}

		return false ;
	} ,

	ownKeys: ( target ) => [ ... MODIFIER_PROXY_LOCAL ] ,
	getOwnPropertyDescriptor: ( target , property ) => {
		// configurable:true is forced by Proxy Invariants
		if ( MODIFIER_PROXY_LOCAL.has( property ) ) {
			return { value: MODIFIER_HANDLER.get( target , property , target ) , configurable: true } ;
		}
	}
} ;

