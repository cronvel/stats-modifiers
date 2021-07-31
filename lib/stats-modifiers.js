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



const lib = {} ;
module.exports = lib ;



function StatsTable( stats = null ) {
	this.stats = {} ;
	this.modifiersTables = [] ;
	this.proxy = null ;

	if ( stats ) { this.setStats( stats ) ; }
}

lib.StatsTable = StatsTable ;



StatsTable.prototype.setStats = function( stats ) {
	for ( let statName in stats ) { this.setStat( statName , stats[ statName ] ) ; }
} ;



StatsTable.prototype.setStat = function( statName , params , pointer = this.stats ) {
	if ( params === null ) {
		delete pointer[ statName ] ;
	}
	else if ( params && typeof params === 'object' && ! ( params instanceof Compound ) && params.__prototypeUID__ !== 'kung-fig/Operator' && params.__prototypeUID__ !== 'kung-fig/Expression' ) {
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
			params.forEach( ( element , index ) => this.setStat( index , element , pointer[ statName ] ) ) ;
		}
		else {
			if ( ! pointer[ statName ] ) { pointer[ statName ] = {} ; }
			Object.keys( params ).forEach( key => this.setStat( key , params[ key ] , pointer[ statName ] ) ) ;
		}
	}
	else {
		if ( pointer[ statName ] ) {
			if ( pointer[ statName ] instanceof Stat ) { pointer[ statName ].set( params ) ; }
			else { return ; }	// drop?
		}
		else {
			pointer[ statName ] = new Stat( this , params ) ;
		}
	}
} ;



StatsTable.prototype.clone = function() {
	var statsTable = new StatsTable() ;
	statsTable.destClone_( this.stats , statsTable.stats ) ;
	return statsTable ;
} ;



StatsTable.prototype.destClone_ = function( source , dest ) {
	var key ,
		keys = Array.isArray( source ) ? source.keys() : Object.keys( source ) ;

	for ( key of keys ) {
		if ( source[ key ] instanceof Stat ) {
			dest[ key ] = new Stat( this , source[ key ].base ) ;
			if ( source[ key ].compound ) { dest[ key ].compound = source[ key ].compound ; }
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



// Stat( parent , base )
// Stat( parent , compound )
function Stat( parent , base = null ) {
	var operator ;

	this.parent = parent ;	// used for compound stats
	this.base = null ;
	this.compound = null ;
	this.modifiers = [] ;
	this.constraints = null ;	// TODO?
	this.proxy = null ;

	if ( base instanceof Compound ) {
		this.compound = base ;
	}
	else if ( base?.__prototypeUID__ === 'kung-fig/Operator' ) {
		this.compound = new Compound( base.operator , base.operand ) ;
	}
	else if ( base?.__prototypeUID__ === 'kung-fig/Expression' ) {
		this.compound = new Compound( base ) ;
	}
	else {
		this.base = base ;
	}
}

lib.Stat = Stat ;

Stat.prototype.set = function( base ) {
	this.base = base ;
} ;



Stat.prototype.getActual = function() {
	var actual ;

	if ( this.compound ) {
		actual = this.compound.getActual( this.parent ) ;
	}
	else {
		actual = this.base ;
	}

	// It should be already sorted, since it's sorted on insertion
	for ( let modifier of this.modifiers ) {
		if ( modifier.active ) { actual = modifier.apply( actual ) ; }
	}

	return actual ;
} ;



Stat.prototype.getProxy = function() {
	if ( this.proxy ) { return this.proxy ; }
	this.proxy = new Proxy( this , STAT_HANDLER ) ;
	return this.proxy ;
} ;



function Compound( operator , stats ) {
	this.fn = null ;
	this.stats = null ;
	this.isBuiltin = true ;

	if ( typeof operator === 'string' ) {
		if ( ! compounds[ operator ] ) { throw new Error( "Unknown compound operator '" + operator + "'" ) ; }
		this.fn = compounds[ operator ] ;
		this.stats = Array.isArray( stats ) ? stats : [ stats ] ;
	}
	else if ( typeof operator === 'function' ) {
		this.fn = operator ;
		this.isBuiltin = false ;
	}
	else if ( operator?.__prototypeUID__ === 'kung-fig/Expression' ) {
		this.fn = Compound.expressionToFn( operator ) ;
		this.isBuiltin = false ;
	}
	else {
		throw new Error( "Compound: bad operator type" ) ;
	}
}

lib.Compound = Compound ;



Compound.prototype.getActual = function( parent ) {
	if ( this.isBuiltin ) {
		return this.fn( this.stats.map( statName => {
			var stat = dotPath.get( parent.stats , statName ) ;
			return stat instanceof Stat ? stat.getActual() : null ;
		} ) ) ;
	}

	return this.fn( parent.getProxy() ) ;
} ;



// Patch Kung Fig expression, to append .actual to each ref
Compound.patchExpressionRef = function( expression ) {
	for ( let arg of expression.args ) {
		if ( arg && typeof arg === 'object' ) {
			if ( arg.__prototypeUID__ === 'kung-fig/Ref' ) { arg.appendPart( 'actual' ) ; }
			else if ( arg.__prototypeUID__ === 'kung-fig/Expression' ) { Compound.patchExpressionRef( arg ) ; }
		}
	}
} ;

Compound.expressionToFn = function( expression ) {
	// Do not modify the original Expression, coming from the KFG
	expression = expression.clone() ;
	Compound.patchExpressionRef( expression ) ;
	return expression.compile() ;
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

	// Check for the mono-modifier syntax, enclose it inside an array
	if ( ! Array.isArray( modifiers ) ) { modifiers = [ modifiers ] ; }
	else if ( ! modifiers[ 0 ] || typeof modifiers[ 0 ] !== 'object' ) { modifiers = [ modifiers ] ; }

	if ( ! this.statsModifiers[ statName ] ) { this.statsModifiers[ statName ] = {} ; }

	for ( let modifier of modifiers ) {
		if ( modifier && typeof modifier === 'object' ) {
			// There is the “classic” array syntax, and the object syntax (later is used by the KFG operator syntax)
			if ( Array.isArray( modifier ) ) { this.setStatModifier( statName , ... modifier ) ; }
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



ModifiersTable.prototype.clone = function( changeId = true ) {
	return this.instanciate( changeId ? lib.createCloneId( this.id ) : this.id ) ;
} ;



// If fromCloneId is set, we want to clone rather than instanciate a template, but since this share a lot of code...
ModifiersTable.prototype.instanciate = function( fromCloneId ) {
	if ( ! this.isTemplate && ! fromCloneId ) { return this ; }	// /!\ or error???

	var statName , modifiers , eventName , events ,
		instance = new ModifiersTable(
			fromCloneId || this.id + '_' + ( this.templateInstanceCount ++ ) ,
			null ,
			this.active ,
			fromCloneId ? this.isTemplate : false
		) ;

	for ( statName in this.statsModifiers ) {
		modifiers = Object.values( this.statsModifiers[ statName ] ).map( e => [ e.operator , e.operand , e.priorityGroup ] ) ;
		instance.setStatModifiers( statName , modifiers ) ;
	}

	for ( eventName in this.events ) {
		this.events[ eventName ].forEach( event => instance.setEvent_( eventName , event.times , event.every , event.action , event.params ) ) ;
	}

	return instance ;
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



Modifier.prototype.apply = function( existingValue ) {
	return this.fn( existingValue , this.operand ) ;
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



// Proxy handlers



//const SYMBOL_ID = Symbol( 'id' ) ;
const SYMBOL_PARENT = Symbol( 'parent' ) ;
const SYMBOL_STAT_NAME = Symbol( 'statName' ) ;
const SYMBOL_PROXY = Symbol( 'proxy' ) ;
const SYMBOL_UNPROXY = lib.UNPROXY = Symbol( 'unproxy' ) ;

const STATS_TABLE_PROXY_METHODS = new Set( [ 'setStat' , 'stack' , 'unstack' , 'trigger' ] ) ;

const STATS_TABLE_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === SYMBOL_UNPROXY ) { return target ; }

		if ( STATS_TABLE_PROXY_METHODS.has( property ) ) {
			//return Reflect.get( target , property , receiver ) ;	// Don't work, not bounded
			return target[ property ].bind( target ) ;
		}

		if ( property === 'modifiersTables' || property === 'mods' ) {
			return target.getModifiersTablesProxy() ;
		}

		if ( target.stats[ property ] && typeof target.stats[ property ] === 'object' ) {
			let maybeStat = target.stats[ property ] ;
			if ( maybeStat instanceof Stat ) { return maybeStat.getProxy() ; }
			if ( maybeStat[ SYMBOL_PROXY ] ) { return maybeStat[ SYMBOL_PROXY ] ; }
			maybeStat[ SYMBOL_PARENT ] = target ;
			maybeStat[ SYMBOL_STAT_NAME ] = property ;
			return maybeStat[ SYMBOL_PROXY ] = new Proxy( maybeStat , INTERMEDIATE_STATS_TABLE_HANDLER ) ;
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
		var targetValue = target[ property ] ;

		if ( targetValue && typeof targetValue === 'object' ) {
			if ( typeof targetValue.getProxy === 'function' ) { return targetValue.getProxy() ; }

			if ( targetValue instanceof Stat ) { return targetValue.getProxy() ; }
			if ( targetValue[ SYMBOL_PROXY ] ) { return targetValue[ SYMBOL_PROXY ] ; }
			targetValue[ SYMBOL_PARENT ] = target[ SYMBOL_PARENT ] ;
			targetValue[ SYMBOL_STAT_NAME ] = property ;
			return targetValue[ SYMBOL_PROXY ] = new Proxy( targetValue , INTERMEDIATE_STATS_TABLE_HANDLER ) ;
		}

		return Reflect.get( target , property , receiver ) ;
	}
	//set: ( target , property , value , receiver ) => {}
} ;



const STAT_PROXY_METHODS = new Set( [] ) ;
const STAT_PROXY_LOCAL = new Set( [ 'base' ] ) ;

const STAT_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( STAT_PROXY_METHODS.has( property ) ) {
			//return Reflect.get( target , property , receiver ) ;	// Don't work, not bounded
			return target[ property ].bind( target ) ;
		}

		if ( STAT_PROXY_LOCAL.has( property ) ) {
			return Reflect.get( target , property , receiver ) ;
		}

		if ( property === 'actual' ) {
			return target.getActual() ;
		}

		return ;
	} ,
	set: ( target , property , value , receiver ) => {
		if ( STAT_PROXY_METHODS.has( property ) ) { return false ; }
		if ( property === 'actual' ) { return false ; }

		if ( property === 'base' ) {
			target.set( value ) ;
			return true ;
		}

		return false ;
	} ,

	ownKeys: ( target ) => [ ... STAT_PROXY_LOCAL , 'actual' ] ,
	getOwnPropertyDescriptor: ( target , property ) => {
		// configurable:true is forced by Proxy Invariants
		if ( STAT_PROXY_LOCAL.has( property ) || property === 'actual' ) {
			return { value: STAT_HANDLER.get( target , property , target ) , configurable: true } ;
		}
	}
} ;



const MODIFIERS_TABLE_PROXY_METHODS = new Set( [ 'setStatModifiers' , 'trigger' ] ) ;

const MODIFIERS_TABLE_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === SYMBOL_UNPROXY ) { return target ; }

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

