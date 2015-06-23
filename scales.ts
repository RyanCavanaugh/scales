/// Returns a list of keys (strings) in an enum lookup object
function getEnumNames(enumType: { [s: number]: string; }): string[] {
    var names: string[] = [];
    for (var n in enumType) {
        if (typeof enumType[n] === 'number' && typeof enumType[enumType[n]] === 'string') names.push(n);
    }
    return names;
}

/// Returns a list of values (numbers) in an enum lookup object
function getEnumValues<T>(enumType: { [s: number]: string; }): T[] {
    var values: T[] = [];
    for (var n in enumType) {
        if (typeof enumType[n] === 'string' && typeof enumType[enumType[n]] === 'number') values.push(<T><any>enumType[enumType[n]]);
    }
    return values;
}

/// Denotes a named note, also known as a pitch class. This is different from a pitch, which is an actual frequency
export enum Note {
    C, 'C♯',
    D, 'D♯',
    E,
    F, 'F♯',
    G, 'G♯',
    A, 'A♯',
    B,
    Octave
}

/// Given a string, e.g. "A#", return the corresponding note
export function parseNote(s: string): Note {
    return Note[s.replace('#', '♯')];
}

export function noteToString(n: Note): string {
    return Note[n];
}

/// A list containing all of the named notes (A through G#)
export var NoteValues = getEnumValues<Note>(Note).filter(n => n !== Note.Octave);

/// A pitch (i.e. frequency) is a combination of a pitch and an octave, e.g. C4 is Middle C.
/// This class is intended to be immutable.
export class Pitch {
    public value = this.note + this.octave * Note.Octave;

    constructor(public note: Note, public octave: number) { }

    /// Parses a pitch from a string value, e.g. "A4" -> [A, 4]
    static parse(s: string): Pitch {
        var parse = /([A-Z][#♯]?)([0-9])/.exec(s);
        if (parse === null) throw new Error('Invalid pitch ' + s);
        var note = parseNote(parse[1]);
        return new Pitch(note, parseInt(parse[2]));
    }

    /// Given a number (retrieved from some other pitch's "value" property, return the corresponding pitch
    static fromValue(val: number): Pitch {
        return new Pitch(val % Note.Octave, Math.floor(val / Note.Octave));
    }
}

/// Defines a scale pattern, e.g. the major scale that consists of
/// a set of intervals (measured in semitones) 2, 2, 1, 2, 2, 2, 1.
/// This class is intended to be immutable.
export class ScalePattern {
    /// The set of intervals that define this scale
    public intervals: number[];
    /// A computed list of offsets from the scale origin, e.g. for the
    /// major scale this list is 2, 4, 5, 7, 9, 11, 12
    public offsets: number[];

    constructor(public name: string, ...intervals: number[]) {
        this.intervals = intervals;
        var x = 0;
        // Compute the offsets based on the intervals
        this.offsets = this.intervals.map(int => (x += int) - int);
    }
}

/// Defines a scale, which is a Scale Pattern along with a root Note. Note
/// that this is not a pitch-based scale.
export class Scale {
    constructor(public pattern: ScalePattern, public root: Note) { }

    public contains(note: Note): boolean;
    public contains(pitch: Pitch): boolean;
    public contains(noteOrPitch: any): boolean {
        var note: Note;
        if (typeof noteOrPitch === 'number') {
            note = noteOrPitch;
        } else {
            note = (<Pitch>noteOrPitch).note;
        }
        return this.pattern.offsets.indexOf((Note.Octave + (note - this.root)) % Note.Octave) >= 0;
    }

    public ordinalOf(note: Note): number;
    public ordinalOf(pitch: Pitch): number;
    public ordinalOf(noteOrPitch: any): number {
        var note: Note;
        if (typeof noteOrPitch === 'number') {
            note = noteOrPitch;
        } else {
            note = (<Pitch>noteOrPitch).note;
        }

        return this.pattern.offsets.indexOf((Note.Octave + (note - this.root)) % Note.Octave);
    }
}

/// Defines a tuning pattern for a stringed instrument
export class Tuning {
    public strings: Pitch[];

    constructor(strings: Pitch[]);
    constructor(strings: string[]);
    constructor(...strings: Pitch[]);
    constructor(...strings: string[]);
    constructor(...strings: any[]) {
        if (typeof strings[0] === 'object' && strings[0] instanceof Array) {
            strings = strings[0];
        }
        if (typeof strings[0] === 'string') {
            strings = strings.map(s => Pitch.parse(s));
        }
        this.strings = strings;
        this.strings.reverse();
    }
}

/// Defines a fret somewhere on a given string. Note that fret numbers
/// on instruments like a 5-string banjo may not start at 0 for all strings.
export class Fretting {
    constructor(public stringIndex: number, public fret: number) { }

    static equal(lhs: Fretting, rhs: Fretting) {
        return (lhs.fret === rhs.fret) && (lhs.stringIndex === rhs.stringIndex);
    }
}

export namespace PredefinedScales {
    export var Major = new ScalePattern("Major", 2, 2, 1, 2, 2, 2, 1);
    export var Minor = new ScalePattern("Minor", 2, 1, 2, 2, 1, 2, 2);
    export var PentatonicMajor = new ScalePattern("Pentatonic Major", 2, 2, 3, 2, 3);
    export var PentatonicMinor = new ScalePattern("Penatonic Minor", 3, 2, 2, 3, 2);

    export var ScaleList = [
        Major, Minor, PentatonicMajor, PentatonicMinor
    ];
}

/// Defines a stringed instrument. Instruments like the 5-string banjo,
/// which have one or more strings that don't go all the way to the
/// lowest fret, are not yet supported.
export class Instrument {
    constructor(public name: string, public tuning: Tuning) { }

    /// Given a pitch, finds the lowest fretting at or above 'minimumFret' that
    /// can produce that pitch. May return undefined if that is impossible.
    public getFretting(pitch: Pitch, minimumFret = 0) {
        for (var i = 0; i < this.tuning.strings.length; i++) {
            var fret = pitch.value - this.tuning.strings[i].value;
            if (fret <= minimumFret) {
                return new Fretting(i, fret);
            }
        }
        return undefined;
    }

    /// Calculates the fretting required to get the specified pitch on the given
    /// string. Returns undefined if this is impossible.
    public getFretAtString(pitch: Pitch, stringIndex: number): number {
        var fret = pitch.value - this.tuning.strings[stringIndex].value;
        if (fret < 0) {
            return undefined;
        } else {
            return fret;
        }
    }

    public pitchAtFret(fretting: Fretting) {
        return Pitch.fromValue(this.tuning.strings[fretting.stringIndex].value + fretting.fret);
    }

    public pitchAt(string: number, fret: number) {
        return Pitch.fromValue(this.tuning.strings[string].value + fret);
    }
}

export module PredefinedInstruments {
    /// The four main strings of a standard-tuned 5-string banjo (DGBD)
    export var Banjo = new Instrument('Banjo (DGBD)', new Tuning('D3', 'G3', 'B3', 'D4'));
    /// A standard-tuned mandolin (GDAE)
    export var Mandolin = new Instrument('Mandolin', new Tuning('G3', 'D4', 'A4', 'E5'));
    /// A standard-tuned guitar (EADGBE)
    export var Guitar = new Instrument('Guitar', new Tuning('E2', 'A2', 'D3', 'G3', 'B3', 'E4'));

    export var InstrumentList = [Banjo, Mandolin, Guitar];
}

/// Returns the index of the string that has the lowest pitch above a given value.
function lowestString(instr: Instrument, minimum = -Infinity) {
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
export function applyScaleToFretRange(scale: Scale, instr: Instrument, minimumFret: number, maximumFret: number): Fretting[] {
    // Algorithm:
    // Start with the lowest string / lowest fret, walk up and add
    // matching notes from the scale to the frettings. When we encounter
    // a fretting that is beyond the maximum fret, attempt to re-place the
    // note at the next higher string. If that operation fails, the scale
    // cannot be applied in this range and we should bail. Otherwise,
    // continue until we would walk past the end of the highest string

    var result: Fretting[] = [];
    var currentString = lowestString(instr);
    // Complex function because not all instruments tune their strings in increasing order (e.g. ukulele)
    var getNextString = () => lowestString(instr, instr.tuning.strings[currentString].value + 1);
    var currentFret = minimumFret;
    while (true) {
        var currentPitch = instr.pitchAt(currentString, currentFret);
        if (scale.contains(currentPitch)) {
            if (currentFret > maximumFret) {
                // If we're at the highest string already, this is a successful application
                if (getNextString() === undefined) {
                    // If we don't actually use any frets at the minimum, fail
                    if (result.every(f => f.fret > minimumFret)) {
                        return undefined;
                    } else {
                        return result;
                    }
                } else {
                    // Try to locate this pitch on the next higher string
                    var nextString = getNextString();
                    var nextFret = instr.getFretAtString(currentPitch, nextString);
                    if (nextFret === undefined) {
                        // Failed, next string is not low enough
                        return undefined;
                    } else if ((nextFret < minimumFret) || (nextFret > maximumFret)) {
                        // Continuing the scale onto the next string results in us
                        // going below the minimum fret, so bail
                        return undefined;
                    } else {
                        // Successfully placed on the next string; pick up from one below the
                        // minimum fret (since we might want to reduplicate some notes)
                        currentFret = minimumFret - 1;
                        currentString = nextString;
                    }
                }
            } else {
                result.push({ fret: currentFret, stringIndex: currentString });
            }
        }

        currentFret++;
    }

    return null;
}

function generateScalePatternsOld(scale: Scale, instr: Instrument, maxSpread = 4, lastStartFret = 12): Fretting[][] {
    var results: Fretting[][] = [];

    for (var startFret = 0; startFret <= lastStartFret; startFret++) {
        var success = true;

        // Algorithm: Apply all the scale notes between the start and max fret. Once finished,
        // reorder the frettings by pitch and check for gaps in the scale

        var currentResult: Fretting[] = [];

        for (var stringIndex = instr.tuning.strings.length - 1; stringIndex >= 0; stringIndex--) {
            for (var fret = startFret; fret < startFret + maxSpread; fret++) {
                var pitch = instr.pitchAt(stringIndex, fret);
                if (scale.contains(pitch)) {
                    currentResult.push(new Fretting(stringIndex, fret));
                }
            }
        }

        console.log('Candidate from fret ' + startFret + ' = ' + currentResult.map(f => {
            return '(' + f.stringIndex + ', ' + f.fret + '): ' + Note[instr.pitchAtFret(f).note] + instr.pitchAtFret(f).octave + ' = ' + scale.ordinalOf(instr.pitchAtFret(f));
        }).join('\n'));

        var pitches = currentResult.map(fretting => instr.pitchAtFret(fretting));
        pitches.sort((a, b) => a.value > b.value ? 1 : a.value < b.value ? -1 : 0);

        //console.log('test ' + JSON.stringify(pitches));
        //console.log('test ' + JSON.stringify(pitches.map(p => scale.ordinalOf(p))));
        //console.log('test ' + JSON.stringify(currentResult));
        var lastPitch = pitches[0];
        for (var i = 1; i < pitches.length; i++) {
            var thisPitch = pitches[i];
            if (thisPitch.value <= lastPitch.value) {
                // OK
            } else {
                var thisOrdinal = scale.ordinalOf(thisPitch);
                var lastOrdinal = scale.ordinalOf(lastPitch);

                if (thisOrdinal === lastOrdinal + 1) {
                    // OK
                } else if (thisOrdinal === 0 && lastOrdinal === scale.pattern.intervals.length - 1) {
                    // OK
                } else {
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
function stretch(fingering: Fretting[]) {
    var min = Math.min.apply(undefined, fingering.filter(f => f.fret !== 0).map(f => f.fret));
    var max = Math.max.apply(undefined, fingering.map(f => f.fret));
    return max - min;
}

/// Removes fret patterns that overlap by a significant amount
export function cullOverlappingPatterns(patterns: Fretting[][]) {
    var current = patterns[0];
    var results: Fretting[][] = [];

    for (var i = 1; i < patterns.length - 1; i++) {
        var next = patterns[i];

        var overlap = 0;
        for (var j = 0; j < next.length; j++) {
            if (current.some(f => Fretting.equal(f, next[j]))) {
                overlap++;
            }
        }

        if (overlap > (next.length * 4 / 5)) {
            // Overlap
            if (stretch(next) < stretch(current)) {
                current = next;
            }
        } else {
            // No overlap
            results.push(current);
            current = next;
        }
    }
    results.push(current);
    return results;
}

function applyScale(scale: Scale, instr: Instrument, minimumFret = 0, maxFret = 14): Fretting[] {
    var result: Fretting[] = [];

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

