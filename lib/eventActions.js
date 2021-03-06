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



exports.activate = modifiersTable => modifiersTable.activate() ;
exports.deactivate = modifiersTable => modifiersTable.deactivate() ;
exports.remove = modifiersTable => modifiersTable.destroy() ;

exports.fade = ( modifiersTable , eventData , params ) => {
	var done = true ,
		neutralized = true ,
		amount = Math.abs( + params?.amount || 1 ) ;

	modifiersTable.forEachModifier( modifier => {
		var neutral = modifier.fn.neutral ;

		if ( neutral === null ) {
			neutralized = false ;
		}
		else if ( modifier.operand <= neutral + amount && modifier.operand >= neutral - amount ) {
			modifier.operand = neutral ;
		}
		else if ( modifier.operand > neutral ) {
			modifier.operand -= amount ;
			done = neutralized = false ;
		}
		else {
			modifier.operand += amount ;
			done = neutralized = false ;
		}
	} ) ;

	if ( done ) {
		eventData.done = true ;

		// Default to true if neutralized, because by default we should avoid having deprecated effect still hanging around,
		// they should be garbage collected by the lib.
		if ( neutralized ? params?.destroy !== false : params?.destroy === true ) {
			modifiersTable.destroy() ;
		}
	}
} ;

