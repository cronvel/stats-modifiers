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



const ops = {} ;
module.exports = ops ;



// Number operators

// base, set before anything else
ops[ ':' ] =
ops.base = ( existing , operand ) => operand ;
ops.base.priorityGroup = 1 ;
ops.base.priority = 1000 ;
ops.base.type = 'number' ;

// set, set after anything else
ops[ '=' ] =
ops.set = ( existing , operand ) => operand ;
ops.set.priorityGroup = -1 ;
ops.set.priority = -1000 ;
ops.set.type = 'number' ;

ops[ '+' ] =
ops.plus = ( existing , operand ) => existing + operand ;
ops.plus.priority = 1 ;
ops.plus.neutral = 0 ;
ops.plus.type = 'number' ;

ops[ '-' ] =
ops.minus = v => -v ;
ops.minus.convert = 'plus' ;

// % (work with KFG percent syntax)
ops[ '%' ] =
ops.plusBaseRate = ( existing , operand , base ) => existing + base * ( operand - 1 ) ;
ops.plusBaseRate.merge = ( a , b ) => a + b - 1  ;
ops.plusBaseRate.priority = 1 ;
ops.plusBaseRate.neutral = 1 ;
ops.plusBaseRate.type = 'number' ;

ops[ '*' ] =
ops.multiply = ( existing , operand ) => existing * operand ;
ops.multiply.priority = 0 ;
ops.multiply.neutral = 1 ;
ops.multiply.type = 'number' ;

ops[ '/' ] =
ops.divide = v => 1 / v ;
ops.divide.convert = 'multiply' ;

ops[ '^' ] =
ops[ '**' ] =
ops.power = ( existing , operand ) => existing ** operand ;
ops.power.merge = ( a , b ) => a * b ;
ops.power.priority = -1 ;
ops.power.neutral = 1 ;
ops.power.type = 'number' ;

// at least
ops[ '>=' ] =
ops.atLeast = ( existing , operand ) => Math.max( existing , operand ) ;
ops.atLeast.priorityGroup = -1 ;
ops.atLeast.priority = -999 ;
ops.atLeast.type = 'number' ;

// at most
ops[ '<=' ] =
ops.atMost = ( existing , operand ) => Math.min( existing , operand ) ;
ops.atMost.priorityGroup = -1 ;
ops.atMost.priority = -999 ;
ops.atMost.type = 'number' ;



// String operators

// base, set before anything else
ops[ '_:' ] =
ops.base = ( existing , operand ) => operand ;
ops.base.priorityGroup = 1 ;
ops.base.priority = 1000 ;
ops.base.type = 'string' ;

// set, set after anything else
ops[ '_=' ] =
ops.set = ( existing , operand ) => operand ;
ops.set.priorityGroup = -1 ;
ops.set.priority = -1000 ;
ops.set.type = 'string' ;

ops[ '_+' ] =
ops.append = ( existing , operand ) => existing + ' ' + operand ;
ops.append.priority = 1 ;
ops.append.type = 'string' ;

ops[ '+_' ] =
ops.prepend = ( existing , operand ) => operand + ' ' + existing ;
ops.prepend.priority = 1 ;
ops.prepend.type = 'string' ;



// Set operators

ops[ '#+' ] =
ops.addToSet = ( existing , operand ) => {
	if ( ! Array.isArray( operand ) ) { operand = [ operand ] ; }
	for ( let item of operand ) { existing.add( item ) ; }
	return existing ;
} ;
ops.addToSet.priority = 1 ;
ops.addToSet.type = 'set' ;

ops[ '#-' ] =
ops.removeFromSet = ( existing , operand ) => {
	if ( ! Array.isArray( operand ) ) { operand = [ operand ] ; }
	for ( let item of operand ) { existing.delete( item ) ; }
	return existing ;
} ;
ops.removeFromSet.priority = 0 ;
ops.removeFromSet.type = 'set' ;

ops[ '#*' ] =
ops.intersectSet = ( existing , operand ) => {
	if ( ! Array.isArray( operand ) ) { operand = [ operand ] ; }

	var result = new Set() ;

	for ( let item of operand ) {
		if ( existing.has( item ) ) { result.add( item ) ; }
	}

	return result ;
} ;
ops.intersectSet.priority = 0 ;
ops.intersectSet.type = 'set' ;



for ( let key in ops ) {
	// The function itself should know its canonical identifier
	if ( ! ops[ key ].id ) { ops[ key ].id = key ; }
	if ( ! ops[ key ].merge ) { ops[ key ].merge = ops[ key ] ; }
	if ( ! ops[ key ].priorityGroup ) { ops[ key ].priorityGroup = 0 ; }
	if ( ! ops[ key ].priority ) { ops[ key ].priority = 0 ; }
	if ( ops[ key ].neutral === undefined ) { ops[ key ].neutral = null ; }
}

