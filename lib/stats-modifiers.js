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



exports.Stat = require( './Stat.js' ) ;
exports.StatsTable = require( './StatsTable.js' ) ;
exports.Modifier = require( './Modifier.js' ) ;
exports.ModifiersTable = require( './ModifiersTable.js' ) ;

exports.CompoundStat = require( './CompoundStat.js' ) ;

exports.Pool = require( './Pool.js' ) ;
exports.Gauge = require( './Gauge.js' ) ;	// DEPRECATED?

exports.HistoryGauge = require( './HistoryGauge.js' ) ;
exports.HistoryGaugeEntry = exports.HistoryGauge.Entry ;

exports.HistoryAlignometer = require( './HistoryAlignometer.js' ) ;
exports.HistoryAlignometerEntry = exports.HistoryAlignometer.Entry ;



const common = require( './common.js' ) ;
exports.SYMBOL_PARENT = common.SYMBOL_PARENT ;	// For unit test
exports.UNPROXY = common.SYMBOL_UNPROXY ;
exports.createCloneId = common.createCloneId ;
exports.unitTestResetCloneId = common.unitTestResetCloneId ;

