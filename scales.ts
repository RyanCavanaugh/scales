/// Denotes a named note, also known as a pitch class. This is different from a pitch, which is an actual frequency
export type Note = "C" | "C♯" | "D" | "D♯" | "E" | "F" | "F♯" | "G" | "G♯" | "A" | "A♯" | "B";
const Octave = 12;
export const NoteNames: ReadonlyArray<Note> = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];

export function offsetOfNote(note: Note): number {
    return NoteNames.indexOf(note);
}

/// Given a string, e.g. "A#", return the corresponding note
export function parseNote(s: string): Note {
    return s.replace('#', '♯') as Note;
}

/// A pitch (i.e. frequency) is a combination of a pitch and an octave, e.g. C4 is Middle C.
export type Pitch = {
    readonly note: Note,
    readonly octave: number;
    readonly value: number;
};
export function createPitch(note: Note, octave: number): Pitch {
    return { note, octave, value: offsetOfNote(note) + octave * 12 };
}
/// Parses a pitch from a string value, e.g. "A4" -> [A, 4]
export function parsePitch(name: string) {
    var parse = /([A-Z][#♯]?)([0-9])/.exec(name);
    if (parse === null) throw new Error('Invalid pitch ' + name);
    var note = parseNote(parse[1]);
    return createPitch(note, parseInt(parse[2]));
}
/// Given a number (retrieved from some other pitch's "value" property, return the corresponding pitch
export function pitchFromValue(value: number) {
    return createPitch(NoteNames[value % 12], Math.floor(value / 12));
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
type Scale = {
    readonly pattern: ScalePattern,
    readonly root: Note
};
export function createScale(pattern: ScalePattern, root: Note): Scale {
    return { pattern, root };
}
export function scaleContainsNote(scale: Scale, note: Note) {
    const noteValue = offsetOfNote(note);
    const rootValue = offsetOfNote(scale.root);
    return scale.pattern.offsets.indexOf((Octave + (noteValue - rootValue)) % Octave) >= 0;
}
export function scaleContainsPitch(scale: Scale, pitch: Pitch) {
    return scaleContainsNote(scale, pitch.note);
}

/*
export class Scale {
    constructor(public pattern: ScalePattern, public root: Note) { }


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
*/

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
            strings = strings.map(s => parsePitch(s));
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
    export const Major = new ScalePattern("Major", 2, 2, 1, 2, 2, 2, 1);
    export const Minor = new ScalePattern("Minor", 2, 1, 2, 2, 1, 2, 2);
    export const PentatonicMajor = new ScalePattern("Pentatonic Major", 2, 2, 3, 2, 3);
    export const PentatonicMinor = new ScalePattern("Penatonic Minor", 3, 2, 2, 3, 2);
    export const PentatonicBluegrass = new ScalePattern("Pentatonic Bluegrass", 2, 1, 1, 3, 2, 1, 2);

    export var ScaleList = [
        Major, Minor, PentatonicMajor, PentatonicMinor, PentatonicBluegrass
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
    public getFretAtString(pitch: Pitch, stringIndex: number): number | undefined {
        var fret = pitch.value - this.tuning.strings[stringIndex].value;
        if (fret < 0) {
            return undefined;
        } else {
            return fret;
        }
    }

    public pitchAtFret(fretting: Fretting) {
        return pitchFromValue(this.tuning.strings[fretting.stringIndex].value + fretting.fret);
    }

    public pitchAt(string: number, fret: number) {
        return pitchFromValue(this.tuning.strings[string].value + fret);
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
    let lowestString = undefined;
    let lowestPitch = Infinity;
    for (var i = 0; i < instr.tuning.strings.length; i++) {
        if ((instr.tuning.strings[i].value < lowestPitch) && (instr.tuning.strings[i].value > minimum)) {
            lowestString = i;
            lowestPitch = instr.tuning.strings[i].value;
        }
    }
    return lowestString!;
}

/// Attempts to apply the scale to the instrument over the specified fret range,
/// returning undefined if this isn't possible to do so continuously, or a set
/// of frettings otherwise. 
export function applyScaleToFretRange(scale: Scale, instr: Instrument, minimumFret: number, maximumFret: number): undefined | Fretting[] {
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
        if (scaleContainsPitch(scale, currentPitch)) {
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
        if (scaleContainsPitch(scale, pitch)) {
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

