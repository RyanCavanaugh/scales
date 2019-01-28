var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
define(["require", "exports", "react", "react-dom", "./scales"], function (require, exports, React, ReactDOM, Scales) {
    "use strict";
    exports.__esModule = true;
    var AsciiScaleString = /** @class */ (function (_super) {
        __extends(AsciiScaleString, _super);
        function AsciiScaleString() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AsciiScaleString.prototype.render = function () {
            var _this = this;
            var maxFret = this.props.scale.reduce(function (oldMax, value) { return Math.max(oldMax, value.fret); }, 0);
            var range = Array.apply(null, { length: maxFret }).map(Number.call, Number);
            range[0] = 0;
            return React.createElement("div", { className: "string-container" },
                React.createElement("div", { className: "string" },
                    React.createElement("span", { className: "string-name" }, Scales.noteToString(this.props.instrument.tuning.strings[this.props.stringIndex].note)),
                    React.createElement("span", { className: "nut" }, "|"),
                    range.map(function (_$, i) {
                        return React.createElement("span", { className: "fret", key: i },
                            padLeft(_this.props.scale.some(function (f) { return ((f.fret === i) && (f.stringIndex === _this.props.stringIndex)); }) ? i.toString() : '', '-', 3),
                            "-");
                    })));
            function padLeft(value, padding, desiredLength) {
                if (value.length === desiredLength)
                    return value;
                return padLeft(padding + value, padding, desiredLength);
            }
        };
        return AsciiScaleString;
    }(React.Component));
    var AsciiScale = /** @class */ (function (_super) {
        __extends(AsciiScale, _super);
        function AsciiScale() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        AsciiScale.prototype.renderScale = function () {
            var frets = this.props.scale;
            var instr = this.props.instrument;
            var lines = [];
            var maxFret = frets.reduce(function (oldMax, value) { return Math.max(oldMax, value.fret); }, 0);
            for (var i = 0; i < instr.tuning.strings.length; i++) {
                var line = padLeft(Scales.noteToString(instr.tuning.strings[i].note), ' ', 2);
                line += '|';
                for (var k = 0; k < maxFret; k++) {
                    if (frets.some(function (f) { return f.stringIndex === i && f.fret === k; })) {
                        line += padLeft(k.toString(), '-', 3);
                    }
                    else {
                        line += '---';
                    }
                    line += '-';
                }
                lines.push(line);
            }
            return lines.join('\n');
            function padLeft(value, padding, desiredLength) {
                if (value.length === desiredLength)
                    return value;
                return padLeft(padding + value, padding, desiredLength);
            }
        };
        AsciiScale.prototype.render = function () {
            var _this = this;
            return React.createElement("div", { className: "ascii-scale" }, this.props.instrument.tuning.strings.map(function (_$, i) { return React.createElement(AsciiScaleString, __assign({ stringIndex: i, key: i }, _this.props)); }));
        };
        return AsciiScale;
    }(React.Component));
    var SvgScale = /** @class */ (function (_super) {
        __extends(SvgScale, _super);
        function SvgScale() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SvgScale.prototype.xOfFret = function (f, offset) {
            if (offset === void 0) { offset = false; }
            if (f === 0)
                offset = false;
            return (f - (offset ? 0.33 : 0)) * 60;
        };
        SvgScale.prototype.yOfString = function (s) {
            return s * 36;
        };
        SvgScale.prototype.renderStrings = function () {
            var _this = this;
            return this.props.instrument.tuning.strings.map(function (s, i) {
                var maxFret = _this.getMaxFret() + 1;
                var y = _this.yOfString(i);
                return React.createElement("line", { x1: _this.xOfFret(0), y1: y, x2: _this.xOfFret(maxFret), y2: y, key: 'string_' + i, stroke: 'black' });
            });
        };
        SvgScale.prototype.renderFretMarkings = function () {
            var importantFrets = [0, 3, 5, 7, 10, 12, 15, 17];
            var results = [];
            for (var _i = 0, importantFrets_1 = importantFrets; _i < importantFrets_1.length; _i++) {
                var f = importantFrets_1[_i];
                results.push(React.createElement("text", { key: f, x: this.xOfFret(f) - 9, y: this.yOfString(this.props.instrument.tuning.strings.length - 0.3) }, f));
            }
            return results;
        };
        SvgScale.prototype.renderFrets = function () {
            var maxFret = this.getMaxFret();
            var result = [];
            for (var i = 0; i < maxFret + 1; i++) {
                var x = this.xOfFret(i);
                result.push(React.createElement("line", { x1: x, x2: x, y1: this.yOfString(0), y2: this.yOfString(this.props.instrument.tuning.strings.length - 1), stroke: 'black', key: 'fret_' + i }));
            }
            return result;
        };
        SvgScale.prototype.renderFrettings = function () {
            var _this = this;
            var frets = this.props.scale;
            return frets.map(function (f, i) {
                var x = _this.xOfFret(f.fret, true);
                var y = _this.yOfString(f.stringIndex);
                return [
                    React.createElement("circle", { r: 15, stroke: 'gray', fill: 'black', cx: x, cy: y, key: 'fretting_' + i }),
                    React.createElement("text", { x: x - 6, y: y + 6, fill: 'white', key: 'fretting_label_' + i }, Scales.noteToString(_this.props.instrument.pitchAtFret(f).note))
                ];
            });
        };
        SvgScale.prototype.getMaxFret = function () {
            return this.props.scale.reduce(function (oldMax, value) { return Math.max(oldMax, value.fret); }, 0);
            ;
        };
        SvgScale.prototype.render = function () {
            var x1 = this.xOfFret(-1);
            var x2 = this.xOfFret(this.getMaxFret() + 2);
            var y1 = this.yOfString(-1);
            var y2 = this.yOfString(this.props.instrument.tuning.strings.length + 1);
            return React.createElement("svg", { className: "scale", viewBox: x1 + " " + y1 + " " + x2 + " " + y2, preserveAspectRatio: "xMinYMin" },
                this.renderStrings(),
                this.renderFretMarkings(),
                this.renderFrets(),
                this.renderFrettings());
        };
        return SvgScale;
    }(React.Component));
    var instrument = Scales.PredefinedInstruments.Banjo;
    var frettings = Scales.applyScaleToFretRange(new Scales.Scale(Scales.PredefinedScales.Major, Scales.Note.C), instrument, 0, 17);
    ReactDOM.render(React.createElement(AsciiScale, { instrument: instrument, scale: frettings }), document.getElementById('viewer1'));
    ReactDOM.render(React.createElement(SvgScale, { instrument: instrument, scale: frettings }), document.getElementById('viewer2'));
});
