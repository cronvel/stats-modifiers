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



//exports.SYMBOL_ID = Symbol( 'id' ) ;
exports.SYMBOL_PARENT = Symbol( 'parent' ) ;

exports.SYMBOL_STAT_NAME = Symbol( 'statName' ) ;
exports.SYMBOL_PATH_KEY = Symbol( 'pathKey' ) ;
exports.SYMBOL_PROXY = Symbol( 'proxy' ) ;
exports.SYMBOL_UNPROXY = Symbol( 'unproxy' ) ;

exports.clearObject = object => Object.keys( object ).forEach( key => delete object[ key ] ) ;

exports.isPlainObject = value => {
	if ( ! value || typeof value !== 'object' ) { return false ; }
	var proto = Object.getPrototypeOf( value ) ;
	if ( proto === Object.prototype || proto === null ) { return true ; }
	return false ;
} ;

exports.isPlainObjectOrArray = value => {
	if ( ! value || typeof value !== 'object' ) { return false ; }
	if ( Array.isArray( value ) ) { return true ; }
	var proto = Object.getPrototypeOf( value ) ;
	if ( proto === Object.prototype || proto === null ) { return true ; }
	return false ;
} ;

const NestedStats = require( './NestedStats.js' ) ;

exports.isNested = value => {
	if ( ! value || typeof value !== 'object' ) { return false ; }
	if ( Array.isArray( value ) ) { return false ; }

	if ( value.__prototypeUID__ ) {
		let uid = value.__prototypeUID__ ;
		if ( uid === 'kung-fig/Operator' || uid === 'kung-fig/Expression' || uid === 'kung-fig/Ref' ) {
			return false ;
		}
	}

	if ( value instanceof NestedStats ) { return true ; }

	var proto = Object.getPrototypeOf( value ) ;
	if ( proto === Object.prototype || proto === null ) { return true ; }
	return false ;
} ;

exports.autoTypeOf = value => {
	var type = typeof value ;

	if ( type !== 'object' ) { return type ; }

	if ( value === null ) { return 'null' ; }
	if ( Array.isArray( value ) ) { return 'array' ; }
	if ( value instanceof Set ) { return 'set' ; }

	var proto = Object.getPrototypeOf( value ) ;
	if ( proto === Object.prototype || proto === null ) { return 'plainObject' ; }
	return 'object' ;
} ;



// Utilities...

const cloneRegexp = /_clone_[0-9]+/ ;
var cloneAutoId = 0 ;

exports.createCloneId = id => {
	if ( id.match( cloneRegexp ) ) {
		return id.replace( cloneRegexp , '_clone_' + ( cloneAutoId ++ ) ) ;
	}

	return id + '_clone_' + ( cloneAutoId ++ ) ;
} ;

// Unit test only
exports.unitTestResetCloneId = () => cloneAutoId = 0 ;

