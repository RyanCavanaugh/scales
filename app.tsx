import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as Scales from './scales.js';

function classNames(obj: {[k: string]: boolean}) {
    return Object.keys(obj).filter(k => obj[k]).join(",");
}

interface ScaleProps extends React.Props<{}> {
    instrument: Scales.Instrument;
    scale: Scales.Fretting[];
}

function makeNumericArray(length: number): number[] {
    const arr = [];
    for (let i = 0; i < length; i++) arr.push(i);
    return arr;
}

interface ScaleStringProps extends ScaleProps { stringIndex: number; }
class AsciiScaleString extends React.Component<ScaleStringProps, {}> {
    render() {
        let maxFret = this.props.scale.reduce((oldMax, value) => Math.max(oldMax, value.fret), 0);
        let range = makeNumericArray(maxFret);
        range[0] = 0;
        return <div className="string-container"><div className="string">
            <span className="string-name">{this.props.instrument.tuning.strings[this.props.stringIndex].note}</span>
            <span className="nut">|</span>
            {
            range.map((_$, i) =>
                <span className="fret" key={i}>{padLeft(this.props.scale.some(f => ((f.fret === i) && (f.stringIndex === this.props.stringIndex))) ? i.toString() : '', '-', 3) }-</span>
                )
            }
        </div></div>;


        function padLeft(value: string, padding: string, desiredLength: number): string {
            if (value.length === desiredLength) return value;
            return padLeft(padding + value, padding, desiredLength);
        }
    }
}

class AsciiScale extends React.Component<ScaleProps, {}> {
    private renderScale() {
        let frets = this.props.scale;
        let instr = this.props.instrument;
        let lines: string[] = [];

        let maxFret = frets.reduce((oldMax, value) => Math.max(oldMax, value.fret), 0);

        for (var i = 0; i < instr.tuning.strings.length; i++) {
            let line = padLeft(Scales.noteToString(instr.tuning.strings[i].note), ' ', 2);
            line += '|';
            for (var k = 0; k < maxFret; k++) {
                if (frets.some(f => f.stringIndex === i && f.fret === k)) {
                    line += padLeft(k.toString(), '-', 3);
                } else {
                    line += '---';
                }
                line += '-';
            }
            lines.push(line);
        }

        return lines.join('\n');

        function padLeft(value: string, padding: string, desiredLength: number): string {
            if (value.length === desiredLength) return value;
            return padLeft(padding + value, padding, desiredLength);
        }
    }

    render() {
        return <div className="ascii-scale">
            {this.props.instrument.tuning.strings.map((_$, i) => <AsciiScaleString stringIndex={i} key={i} instrument={this.props.instrument} scale={this.props.scale} />) }
        </div>;
    }
}

class SvgScale extends React.Component<ScaleProps, {}> {
    private xOfFret(f: number, offset = false) {
        if (f === 0) offset = false;
        return (f - (offset ? 0.33 : 0)) * 60;
    }

    private yOfString(s: number) {
        return s * 36;
    }

    private renderStrings() {
        return this.props.instrument.tuning.strings.map((s, i) => {
            let maxFret = this.getMaxFret() + 1;
            let y = this.yOfString(i);
            return <line x1={this.xOfFret(0)} y1={y} x2={this.xOfFret(maxFret)} y2={y} key={'string_' + i} stroke='black' />;
        });
    }

    private renderFretMarkings() {
        let importantFrets = [0, 3, 5, 7, 10, 12, 15, 17];
        let results: JSX.Element[] = [];
        for(let f of importantFrets) {
            results.push(<text key={f} x={this.xOfFret(f) - 9} y={this.yOfString(this.props.instrument.tuning.strings.length - 0.3) }>{f}</text>);
        }
        return results;
    }

    private renderFrets() {
        let maxFret = this.getMaxFret();
        let result: JSX.Element[] = [];
        for (var i = 0; i < maxFret + 1; i++) {
            let x = this.xOfFret(i);
            result.push(<line
                x1={x} x2={x}
                y1={this.yOfString(0)}
                y2={this.yOfString(this.props.instrument.tuning.strings.length - 1)}
                stroke='black'
                key={'fret_' + i} />);
        }
        return result;
    }

    private renderFrettings() {
        let frets = this.props.scale;
        return frets.map((f, i) => {
            let x = this.xOfFret(f.fret, true);
            let y = this.yOfString(f.stringIndex);
            const label = this.props.instrument.pitchAtFret(f).note;
            const classes = classNames({
                "twoChar": label.length > 1
            });
            return [
                <circle r={15} stroke='gray' fill='black' cx={x} cy={y} key={'fretting_' + i} />,
                <text x={x - 6} y={y + 6}  fill='white' key={'fretting_label_' + i} className={classes}>{label}</text>
            ];
        });
    }

    private getMaxFret() {
        return this.props.scale.reduce((oldMax, value) => Math.max(oldMax, value.fret), 0);
    }

    render() {
        let x1 = this.xOfFret(-1);
        let x2 = this.xOfFret(this.getMaxFret() + 2);
        let y1 = this.yOfString(-1);
        let y2 = this.yOfString(this.props.instrument.tuning.strings.length + 1);
        return <svg className="scale"
                    viewBox={`${x1} ${y1} ${x2} ${y2}`}
                    preserveAspectRatio="xMinYMin">
            {this.renderStrings() }
            {this.renderFretMarkings() }
            {this.renderFrets() }
            {this.renderFrettings() }
        </svg>;
    }

}

let instrument = Scales.PredefinedInstruments.Banjo;
let frettings = Scales.applyScaleToFretRange(Scales.createScale(Scales.PredefinedScales.PentatonicBluegrass, "E"), instrument, 0, 17);
ReactDOM.render(<AsciiScale instrument={instrument} scale={frettings!} />, document.getElementById('viewer1'));
ReactDOM.render(<SvgScale instrument={instrument} scale={frettings!} />, document.getElementById('viewer2'));
