define(["require", "exports"], function (require, exports) {
    "use strict";
    exports.__esModule = true;
    /// Returns a list of keys (strings) in an enum lookup object
    function getEnumNames(enumType) {
        var names = [];
        for (var n in enumType) {
            if (typeof enumType[n] === 'number' && typeof enumType[enumType[n]] === 'string')
                names.push(n);
        }
        return names;
    }
    /// Returns a list of values (numbers) in an enum lookup object
    function getEnumValues(enumType) {
        var values = [];
        for (var n in enumType) {
            if (typeof enumType[n] === 'string' && typeof enumType[enumType[n]] === 'number')
                values.push(enumType[enumType[n]]);
        }
        return values;
    }
    /// Denotes a named note, also known as a pitch class. This is different from a pitch, which is an actual frequency
    var Note;
    (function (Note) {
        Note[Note["C"] = 0] = "C";
        Note[Note["C\u266F"] = 1] = "C\u266F";
        Note[Note["D"] = 2] = "D";
        Note[Note["D\u266F"] = 3] = "D\u266F";
        Note[Note["E"] = 4] = "E";
        Note[Note["F"] = 5] = "F";
        Note[Note["F\u266F"] = 6] = "F\u266F";
        Note[Note["G"] = 7] = "G";
        Note[Note["G\u266F"] = 8] = "G\u266F";
        Note[Note["A"] = 9] = "A";
        Note[Note["A\u266F"] = 10] = "A\u266F";
        Note[Note["B"] = 11] = "B";
        Note[Note["Octave"] = 12] = "Octave";
    })(Note = exports.Note || (exports.Note = {}));
    /// Given a string, e.g. "A#", return the corresponding note
    function parseNote(s) {
        return Note[s.replace('#', '♯')];
    }
    exports.parseNote = parseNote;
    function noteToString(n) {
        return Note[n];
    }
    exports.noteToString = noteToString;
    /// A list containing all of the named notes (A through G#)
    exports.NoteValues = getEnumValues(Note).filter(function (n) { return n !== Note.Octave; });
    /// A pitch (i.e. frequency) is a combination of a pitch and an octave, e.g. C4 is Middle C.
    /// This class is intended to be immutable.
    var Pitch = /** @class */ (function () {
        function Pitch(note, octave) {
            this.note = note;
            this.octave = octave;
            this.value = this.note + this.octave * Note.Octave;
        }
        /// Parses a pitch from a string value, e.g. "A4" -> [A, 4]
        Pitch.parse = function (s) {
            var parse = /([A-Z][#♯]?)([0-9])/.exec(s);
            if (parse === null)
                throw new Error('Invalid pitch ' + s);
            var note = parseNote(parse[1]);
            return new Pitch(note, parseInt(parse[2]));
        };
        /// Given a number (retrieved from some other pitch's "value" property, return the corresponding pitch
        Pitch.fromValue = function (val) {
            return new Pitch(val % Note.Octave, Math.floor(val / Note.Octave));
        };
        return Pitch;
    }());
    exports.Pitch = Pitch;
    /// Defines a scale pattern, e.g. the major scale that consists of
    /// a set of intervals (measured in semitones) 2, 2, 1, 2, 2, 2, 1.
    /// This class is intended to be immutable.
    var ScalePattern = /** @class */ (function () {
        function ScalePattern(name) {
            var intervals = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                intervals[_i - 1] = arguments[_i];
            }
            this.name = name;
            this.intervals = intervals;
            var x = 0;
            // Compute the offsets based on the intervals
            this.offsets = this.intervals.map(function (int) { return (x += int) - int; });
        }
        return ScalePattern;
    }());
    exports.ScalePattern = ScalePattern;
    /// Defines a scale, which is a Scale Pattern along with a root Note. Note
    /// that this is not a pitch-based scale.
    var Scale = /** @class */ (function () {
        function Scale(pattern, root) {
            this.pattern = pattern;
            this.root = root;
        }
        Scale.prototype.contains = function (noteOrPitch) {
            var note;
            if (typeof noteOrPitch === 'number') {
                note = noteOrPitch;
            }
            else {
                note = noteOrPitch.note;
            }
            return this.pattern.offsets.indexOf((Note.Octave + (note - this.root)) % Note.Octave) >= 0;
        };
        Scale.prototype.ordinalOf = function (noteOrPitch) {
            var note;
            if (typeof noteOrPitch === 'number') {
                note = noteOrPitch;
            }
            else {
                note = noteOrPitch.note;
            }
            return this.pattern.offsets.indexOf((Note.Octave + (note - this.root)) % Note.Octave);
        };
        return Scale;
    }());
    exports.Scale = Scale;
    /// Defines a tuning pattern for a stringed instrument
    var Tuning = /** @class */ (function () {
        function Tuning() {
            var strings = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                strings[_i] = arguments[_i];
            }
            if (typeof strings[0] === 'object' && strings[0] instanceof Array) {
                strings = strings[0];
            }
            if (typeof strings[0] === 'string') {
                strings = strings.map(function (s) { return Pitch.parse(s); });
            }
            this.strings = strings;
            this.strings.reverse();
        }
        return Tuning;
    }());
    exports.Tuning = Tuning;
    /// Defines a fret somewhere on a given string. Note that fret numbers
    /// on instruments like a 5-string banjo may not start at 0 for all strings.
    var Fretting = /** @class */ (function () {
        function Fretting(stringIndex, fret) {
            this.stringIndex = stringIndex;
            this.fret = fret;
        }
        Fretting.equal = function (lhs, rhs) {
            return (lhs.fret === rhs.fret) && (lhs.stringIndex === rhs.stringIndex);
        };
        return Fretting;
    }());
    exports.Fretting = Fretting;
    var PredefinedScales;
    (function (PredefinedScales) {
        PredefinedScales.Major = new ScalePattern("Major", 2, 2, 1, 2, 2, 2, 1);
        PredefinedScales.Minor = new ScalePattern("Minor", 2, 1, 2, 2, 1, 2, 2);
        PredefinedScales.PentatonicMajor = new ScalePattern("Pentatonic Major", 2, 2, 3, 2, 3);
        PredefinedScales.PentatonicMinor = new ScalePattern("Penatonic Minor", 3, 2, 2, 3, 2);
        PredefinedScales.PentatonicBluegrass = new ScalePattern("Pentatonic Bluegrass", 2, 1, 1, 3, 2, 1, 2);
        PredefinedScales.ScaleList = [
            PredefinedScales.Major, PredefinedScales.Minor, PredefinedScales.PentatonicMajor, PredefinedScales.PentatonicMinor, PredefinedScales.PentatonicBluegrass
        ];
    })(PredefinedScales = exports.PredefinedScales || (exports.PredefinedScales = {}));
    /// Defines a stringed instrument. Instruments like the 5-string banjo,
    /// which have one or more strings that don't go all the way to the
    /// lowest fret, are not yet supported.
    var Instrument = /** @class */ (function () {
        function Instrument(name, tuning) {
            this.name = name;
            this.tuning = tuning;
        }
        /// Given a pitch, finds the lowest fretting at or above 'minimumFret' that
        /// can produce that pitch. May return undefined if that is impossible.
        Instrument.prototype.getFretting = function (pitch, minimumFret) {
            if (minimumFret === void 0) { minimumFret = 0; }
            for (var i = 0; i < this.tuning.strings.length; i++) {
                var fret = pitch.value - this.tuning.strings[i].value;
                if (fret <= minimumFret) {
                    return new Fretting(i, fret);
                }
            }
            return undefined;
        };
        /// Calculates the fretting required to get the specified pitch on the given
        /// string. Returns undefined if this is impossible.
        Instrument.prototype.getFretAtString = function (pitch, stringIndex) {
            var fret = pitch.value - this.tuning.strings[stringIndex].value;
            if (fret < 0) {
                return undefined;
            }
            else {
                return fret;
            }
        };
        Instrument.prototype.pitchAtFret = function (fretting) {
            return Pitch.fromValue(this.tuning.strings[fretting.stringIndex].value + fretting.fret);
        };
        Instrument.prototype.pitchAt = function (string, fret) {
            return Pitch.fromValue(this.tuning.strings[string].value + fret);
        };
        return Instrument;
    }());
    exports.Instrument = Instrument;
    var PredefinedInstruments;
    (function (PredefinedInstruments) {
        /// The four main strings of a standard-tuned 5-string banjo (DGBD)
        PredefinedInstruments.Banjo = new Instrument('Banjo (DGBD)', new Tuning('D3', 'G3', 'B3', 'D4'));
        /// A standard-tuned mandolin (GDAE)
        PredefinedInstruments.Mandolin = new Instrument('Mandolin', new Tuning('G3', 'D4', 'A4', 'E5'));
        /// A standard-tuned guitar (EADGBE)
        PredefinedInstruments.Guitar = new Instrument('Guitar', new Tuning('E2', 'A2', 'D3', 'G3', 'B3', 'E4'));
        PredefinedInstruments.InstrumentList = [PredefinedInstruments.Banjo, PredefinedInstruments.Mandolin, PredefinedInstruments.Guitar];
    })(PredefinedInstruments = exports.PredefinedInstruments || (exports.PredefinedInstruments = {}));
    /// Returns the index of the string that has the lowest pitch above a given value.
    function lowestString(instr, minimum) {
        if (minimum === void 0) { minimum = -Infinity; }
        var lowestString = undefined;
        var lowestPitch = Infinity;
        for (var i = 0; i < instr.tuning.strings.length; i++) {
            if ((instr.tuning.strings[i].value < lowestPitch) && (instr.tuning.strings[i].value > minimum)) {
                lowestString = i;
                lowestPitch = instr.tuning.strings[i].value;
            }
        }
        return lowestString;
    }
    /// Attempts to apply the scale to the instrument over the specified fret range,
    /// returning undefined if this isn't possible to do so continuously, or a set
    /// of frettings otherwise. 
    function applyScaleToFretRange(scale, instr, minimumFret, maximumFret) {
        // Algorithm:
        // Start with the lowest string / lowest fret, walk up and add
        // matching notes from the scale to the frettings. When we encounter
        // a fretting that is beyond the maximum fret, attempt to re-place the
        // note at the next higher string. If that operation fails, the scale
        // cannot be applied in this range and we should bail. Otherwise,
        // continue until we would walk past the end of the highest string
        var result = [];
        var currentString = lowestString(instr);
        // Complex function because not all instruments tune their strings in increasing order (e.g. ukulele)
        var getNextString = function () { return lowestString(instr, instr.tuning.strings[currentString].value + 1); };
        var currentFret = minimumFret;
        while (true) {
            var currentPitch = instr.pitchAt(currentString, currentFret);
            if (scale.contains(currentPitch)) {
                if (currentFret > maximumFret) {
                    // If we're at the highest string already, this is a successful application
                    if (getNextString() === undefined) {
                        // If we don't actually use any frets at the minimum, fail
                        if (result.every(function (f) { return f.fret > minimumFret; })) {
                            return undefined;
                        }
                        else {
                            return result;
                        }
                    }
                    else {
                        // Try to locate this pitch on the next higher string
                        var nextString = getNextString();
                        var nextFret = instr.getFretAtString(currentPitch, nextString);
                        if (nextFret === undefined) {
                            // Failed, next string is not low enough
                            return undefined;
                        }
                        else if ((nextFret < minimumFret) || (nextFret > maximumFret)) {
                            // Continuing the scale onto the next string results in us
                            // going below the minimum fret, so bail
                            return undefined;
                        }
                        else {
                            // Successfully placed on the next string; pick up from one below the
                            // minimum fret (since we might want to reduplicate some notes)
                            currentFret = minimumFret - 1;
                            currentString = nextString;
                        }
                    }
                }
                else {
                    result.push({ fret: currentFret, stringIndex: currentString });
                }
            }
            currentFret++;
        }
        return null;
    }
    exports.applyScaleToFretRange = applyScaleToFretRange;
    function generateScalePatternsOld(scale, instr, maxSpread, lastStartFret) {
        if (maxSpread === void 0) { maxSpread = 4; }
        if (lastStartFret === void 0) { lastStartFret = 12; }
        var results = [];
        for (var startFret = 0; startFret <= lastStartFret; startFret++) {
            var success = true;
            // Algorithm: Apply all the scale notes between the start and max fret. Once finished,
            // reorder the frettings by pitch and check for gaps in the scale
            var currentResult = [];
            for (var stringIndex = instr.tuning.strings.length - 1; stringIndex >= 0; stringIndex--) {
                for (var fret = startFret; fret < startFret + maxSpread; fret++) {
                    var pitch = instr.pitchAt(stringIndex, fret);
                    if (scale.contains(pitch)) {
                        currentResult.push(new Fretting(stringIndex, fret));
                    }
                }
            }
            console.log('Candidate from fret ' + startFret + ' = ' + currentResult.map(function (f) {
                return '(' + f.stringIndex + ', ' + f.fret + '): ' + Note[instr.pitchAtFret(f).note] + instr.pitchAtFret(f).octave + ' = ' + scale.ordinalOf(instr.pitchAtFret(f));
            }).join('\n'));
            var pitches = currentResult.map(function (fretting) { return instr.pitchAtFret(fretting); });
            pitches.sort(function (a, b) { return a.value > b.value ? 1 : a.value < b.value ? -1 : 0; });
            //console.log('test ' + JSON.stringify(pitches));
            //console.log('test ' + JSON.stringify(pitches.map(p => scale.ordinalOf(p))));
            //console.log('test ' + JSON.stringify(currentResult));
            var lastPitch = pitches[0];
            for (var i = 1; i < pitches.length; i++) {
                var thisPitch = pitches[i];
                if (thisPitch.value <= lastPitch.value) {
                    // OK
                }
                else {
                    var thisOrdinal = scale.ordinalOf(thisPitch);
                    var lastOrdinal = scale.ordinalOf(lastPitch);
                    if (thisOrdinal === lastOrdinal + 1) {
                        // OK
                    }
                    else if (thisOrdinal === 0 && lastOrdinal === scale.pattern.intervals.length - 1) {
                        // OK
                    }
                    else {
                        console.log('break at ' + thisOrdinal + ' / ' + lastOrdinal);
                        success = false;
                        break;
                    }
                }
                lastPitch = thisPitch;
            }
            if (success) {
                results.push(currentResult);
            }
        }
        console.log('Generated ' + results.length + ' scales');
        results = cullOverlappingPatterns(results);
        console.log('Culled to ' + results.length);
        return results;
    }
    /// Measures the maximum distance between two fingers needed to produce
    /// a given fretting. Assumes that the 0th fret does not require a finger.
    function stretch(fingering) {
        var min = Math.min.apply(undefined, fingering.filter(function (f) { return f.fret !== 0; }).map(function (f) { return f.fret; }));
        var max = Math.max.apply(undefined, fingering.map(function (f) { return f.fret; }));
        return max - min;
    }
    /// Removes fret patterns that overlap by a significant amount
    function cullOverlappingPatterns(patterns) {
        var current = patterns[0];
        var results = [];
        for (var i = 1; i < patterns.length - 1; i++) {
            var next = patterns[i];
            var overlap = 0;
            for (var j = 0; j < next.length; j++) {
                if (current.some(function (f) { return Fretting.equal(f, next[j]); })) {
                    overlap++;
                }
            }
            if (overlap > (next.length * 4 / 5)) {
                // Overlap
                if (stretch(next) < stretch(current)) {
                    current = next;
                }
            }
            else {
                // No overlap
                results.push(current);
                current = next;
            }
        }
        results.push(current);
        return results;
    }
    exports.cullOverlappingPatterns = cullOverlappingPatterns;
    function applyScale(scale, instr, minimumFret, maxFret) {
        if (minimumFret === void 0) { minimumFret = 0; }
        if (maxFret === void 0) { maxFret = 14; }
        var result = [];
        var string = 0;
        var fret = minimumFret;
        while (string < instr.tuning.strings.length) {
            var pitch = instr.pitchAt(string, fret);
            if (scale.contains(pitch)) {
                result.push(new Fretting(string, fret));
            }
            fret++;
            if (fret >= maxFret) {
                string++;
                fret = minimumFret;
            }
        }
        return result;
    }
});
