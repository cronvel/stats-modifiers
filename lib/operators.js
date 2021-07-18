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



exports[ '+' ] =
exports.plus = ( existing , operand ) => existing + operand ;
exports.plus.priority = 1 ;
exports.plus.neutral = 0 ;

exports[ '-' ] =
exports.minus = v => -v ;
exports.minus.convert = 'plus' ;

exports[ '*' ] =
exports.multiply = ( existing , operand ) => existing * operand ;
exports.multiply.priority = 2 ;
exports.multiply.neutral = 1 ;

exports[ '/' ] =
exports.divide = v => 1 / v ;
exports.divide.convert = 'multiply' ;

// base, set before anything else
exports[ ':' ] =
exports.base = ( existing , operand ) => operand ;
exports.base.priorityGroup = 1 ;
exports.base.priority = 1000 ;

// set, set after anything else
exports[ '=' ] =
exports.set = ( existing , operand ) => operand ;
exports.set.priorityGroup = -1 ;
exports.set.priority = -1000 ;

// at least
exports[ '>=' ] =
exports.atLeast = ( existing , operand ) => Math.max( existing , operand ) ;
exports.atLeast.priorityGroup = -1 ;
exports.atLeast.priority = -999 ;

// at most
exports[ '<=' ] =
exports.atMost = ( existing , operand ) => Math.min( existing , operand ) ;
exports.atMost.priorityGroup = -1 ;
exports.atMost.priority = -999 ;



for ( let key in exports ) {
	// The function itself should know its canonical identifier
	if ( ! exports[ key ].id ) { exports[ key ].id = key ; }
	if ( ! exports[ key ].merge ) { exports[ key ].merge = exports[ key ] ; }
	if ( ! exports[ key ].priorityGroup ) { exports[ key ].priorityGroup = 0 ; }
	if ( ! exports[ key ].priority ) { exports[ key ].priority = 0 ; }
	if ( exports[ key ].neutral === undefined ) { exports[ key ].neutral = null ; }
}

