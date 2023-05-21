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

module.exports = ModifiersTable ;



const Modifier = require( './Modifier.js' ) ;

const common = require( './common.js' ) ;
const operators = require( './operators.js' ) ;
const eventActions = require( './eventActions.js' ) ;

const arrayKit = require( 'array-kit' ) ;



ModifiersTable.prototype.setStatModifiers = function( statName , modifiers ) {
	if ( this.destroyed ) { return ; }

	if ( common.isPlainObject( modifiers ) && modifiers.__prototypeUID__ !== 'kung-fig/Operator' ) {
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
			else if ( ! modifier.operator ) { throw new Error( "Modifier without an operator" ) ; }	// note that some operators don't have right-hand-side operand
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
		key += '_' + ( priorityGroup < 0 ? 'm' + ( - priorityGroup ) : 'p' + priorityGroup ) ;
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
		! changeId ? this.id  :  changeId === true ? common.createCloneId( this.id )  :  changeId  ,
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



const MODIFIERS_TABLE_PROXY_METHODS = new Set( [ 'setStatModifiers' , 'trigger' ] ) ;

const MODIFIERS_TABLE_HANDLER = {
	get: ( target , property ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return ModifiersTable ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }
		if ( property === 'clone' ) { return target.cloneProxy.bind( target ) ; }

		if ( MODIFIERS_TABLE_PROXY_METHODS.has( property ) ) {
			//return Reflect.get( target , property , receiver ) ;	// Don't work, not bounded
			return target[ property ].bind( target ) ;
		}

		if ( target.statsModifiers[ property ] ) {
			let modifiers = target.statsModifiers[ property ] ;
			if ( modifiers[ common.SYMBOL_PROXY ] ) { return modifiers[ common.SYMBOL_PROXY ] ; }
			modifiers[ common.SYMBOL_PARENT ] = target ;
			modifiers[ common.SYMBOL_STAT_NAME ] = property ;
			return modifiers[ common.SYMBOL_PROXY ] = new Proxy( modifiers , INTERMEDIATE_MODIFIERS_TABLE_HANDLER ) ;
		}

		return ;
	} ,
	// Mostly a copy of .get()
	has: ( target , property ) => {
		//if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return true ; }
		if ( property === 'toString' ) { return true ; }
		if ( property === 'clone' ) { return true ; }
		if ( MODIFIERS_TABLE_PROXY_METHODS.has( property ) ) { return true ; }
		if ( target.statsModifiers[ property ] ) { return true ; }
		return false ;
	} ,
	set: () => false ,
	deleteProperty: () => false ,
	ownKeys: ( target ) => [ ... Object.keys( target.statsModifiers ) ] ,
	getOwnPropertyDescriptor: ( target , property ) => {
		// configurable:true is forced by Proxy Invariants
		if ( target.statsModifiers[ property ] ) {
			return { value: MODIFIERS_TABLE_HANDLER.get( target , property , target ) , configurable: true } ;
		}
	} ,
	getPrototypeOf: ( target ) => Reflect.getPrototypeOf( target ) ,
	setPrototypeOf: () => false
} ;



// Proxy for the .statsModifiers[ key ] objects
const INTERMEDIATE_MODIFIERS_TABLE_HANDLER = {
	get: ( target , property , receiver ) => {
		if ( property === common.SYMBOL_UNPROXY ) { return target ; }
		if ( property === 'constructor' ) { return Object ; }
		if ( property === 'toString' ) { return Object.prototype.toString ; }

		var targetValue = target[ property ] ;

		if ( targetValue && typeof targetValue === 'object' ) {
			return targetValue.getProxy() ;
		}

		return Reflect.get( target , property , receiver ) ;
	} ,
	// Mostly a copy of .get()
	has: ( target , property ) => {
		if ( typeof property !== 'string' ) { return false ; }

		if ( property === 'constructor' ) { return true ; }
		if ( property === 'toString' ) { return true ; }

		return property in target ;
	} ,
	set: ( target , property , value ) => {
		if ( typeof property !== 'string' ) { return false ; }

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

			let parent = target[ common.SYMBOL_PARENT ] ,
				statName = target[ common.SYMBOL_STAT_NAME ] ,
				operator = match[ 1 ] ,
				priorityGroup = + match[ 2 ] ;

			parent.setStatModifier( statName , operator , value , priorityGroup ) ;

			return true ;
		}

		return false ;
	} ,
	deleteProperty: ( target , property ) => {
		if ( typeof property !== 'string' ) { return false ; }

		if ( Object.hasOwn( target , property ) ) {
			return delete target[ property ] ;
		}

		return false ;
	} ,
	ownKeys: ( target ) => Object.keys( target ) ,
	getOwnPropertyDescriptor: ( target , property ) => {
		if ( typeof property !== 'string' ) { return ; }
		if ( ! Object.hasOwn( target , property ) ) { return ; }

		return {
			value: target?.getProxy ? target.getProxy() : target ,
			writable: true ,
			// Mandatory, for some reasons .ownKeys() is always cross-checking each props using getOwnPropertyDescriptor().enumerable
			enumerable: true ,
			configurable: true
		} ;
	} ,
	getPrototypeOf: () => Object.prototype ,
	setPrototypeOf: () => false
} ;

