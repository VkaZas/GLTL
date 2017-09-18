(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _LTL_interactive = require('./js/LTL_interactive');

var agent = new _LTL_interactive.ILTL();
agent.generateMatrix();
agent.printMatrix();

},{"./js/LTL_interactive":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Node = function () {
    function Node(op, val) {
        var lc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        var rc = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : null;
        var pa = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : null;
        var complex = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : 0;
        var atoms = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : 0;

        _classCallCheck(this, Node);

        this.op = op; // 0 for operands, 1 for single operator, 2 for bi operator
        this.val = val;
        this.lc = lc;
        this.rc = rc;
        this.pa = pa;
        this.depth = 1;
        this.complex = complex;
        this.atoms = atoms;

        if (this.op === 0) {
            switch (this.val) {
                case 'A':
                    this.atoms = 1 << 3;
                    break;
                case 'B':
                    this.atoms = 1 << 2;
                    break;
                case 'C':
                    this.atoms = 1 << 1;
                    break;
                case 'D':
                    this.atoms = 1;
                    break;
            }
        }
    }

    _createClass(Node, [{
        key: 'addLc',
        value: function addLc(node) {
            this.lc = node;
            this.depth = Math.max(this.depth, node.depth + 1);
            node.pa = this;
            var cnt = 0;
            if (!!this.lc) cnt += this.lc.complex;
            if (!!this.rc) cnt += this.rc.complex;
            this.complex = cnt + 1;
            this.atoms |= this.lc.atoms;
        }
    }, {
        key: 'addRc',
        value: function addRc(node) {
            this.rc = node;
            this.depth = Math.max(this.depth, node.depth + 1);
            node.pa = this;
            var cnt = 0;
            if (!!this.lc) cnt += this.lc.complex;
            if (!!this.rc) cnt += this.rc.complex;
            this.complex = cnt + 1;
            this.atoms |= this.rc.atoms;
        }
    }, {
        key: 'replicate',
        value: function replicate() {
            var res = new Node(this.op, this.val, this.lc, this.rc, this.pa, this.complex, this.atoms);
            if (!!res.lc) {
                res.lc = res.lc.replicate();
                res.lc.pa = res;
            }
            if (!!res.rc) {
                res.rc = res.rc.replicate();
                res.rc.pa = res;
            }
            return res;
        }
    }, {
        key: 'equal',
        value: function equal(node) {
            if (this.val !== node.val) return false;
            if (this.op === 0 && this.val === node.val) return true;

            var resL = true,
                resR = true;

            if (!!this.lc) {
                if (!!node.lc) resL = this.lc.equal(node.lc);else resL = false;
            } else {
                resL = !node.lc;
            }

            if (!!this.rc) {
                if (!!node.rc) resR = this.rc.equal(node.rc);else resR = false;
            } else {
                resR = !node.rc;
            }

            return resL && resR;
        }
    }, {
        key: 'print',
        value: function print() {
            var log = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

            if (this.op === 0) {
                if (!this.pa) if (log) console.log(this.val);
                return this.val;
            }

            var res = '';
            if (this.op === 2) res = '(' + this.lc.print() + ' ' + this.val + ' ' + this.rc.print() + ')';

            if (this.op === 1) res = this.val + ' ' + this.lc.print();

            if (!this.pa) {
                if (log) console.log(res + ' ' + this.complex);
                return res;
            }

            return res;
        }
    }, {
        key: 'getQuadTuple',
        value: function getQuadTuple() {
            var res = { 'A': null, 'B': null, 'C': null, 'D': null };
            if (this.op === 0) {
                res[this.val] = { mark: 1, pow: 0 };
                return res;
            }

            if (!!this.lc) {
                var lRes = this.lc.getQuadTuple();
                for (var key in lRes) {
                    if (res[key] === null) res[key] = lRes[key];
                }
            }

            if (this.rc) {
                var rRes = this.rc.getQuadTuple();
                for (var _key in rRes) {
                    if (res[_key] === null) res[_key] = rRes[_key];else if (rRes[_key] !== null) {
                        res[_key].mark *= rRes[_key].mark;
                        res[_key].pow += rRes[_key].pow;
                    }
                }
            }

            for (var _key2 in res) {
                if (res[_key2] !== null) {
                    if (this.val === 'eventually') res[_key2].pow++;else if (this.val === 'not') res[_key2].mark *= -1;
                }
            }

            return res;
        }
    }]);

    return Node;
}();

var ILTL = exports.ILTL = function () {
    function ILTL(settings) {
        _classCallCheck(this, ILTL);

        // default settings
        Object.assign(this, {
            // constants
            miu: 0.00001,
            theta: 0.00001,
            beta: 0.5,
            alpha: 0.5,
            matrixSize: 5,

            // variables
            mat: [],
            roots: [],
            defaultTask: [new Node(0, 'A', null, null, null), new Node(0, 'B', null, null, null), new Node(0, 'C', null, null, null), new Node(0, 'D', null, null, null)],
            feedbackTable: [],
            learndTask: null,
            targetTask: null,
            currentTask: null
        });

        // customized settings override
        Object.assign(this, settings);
    }

    _createClass(ILTL, [{
        key: 'generateMatrix',
        value: function generateMatrix() {
            var n = this.matrixSize;
            var mat = [];
            var idx = [];
            for (var i = 0; i < n * n; i++) {
                idx.push(i);
            }for (var _i = 0; _i < n; _i++) {
                for (var j = 0; j < n; j++) {
                    mat[_i * n + j] = 'N';
                }
            }

            // generate C position
            // let randC = parseInt(4*Math.random());
            var randC = 1;
            // console.log('randC: ' + randC);
            var posDicC = [0, n - 1, n * (n - 1), n * n - 1];
            mat[posDicC[randC]] = 'C';
            // console.log(posDicC[randC]);
            ILTL.removeByValue(idx, posDicC[randC]);
            // console.log(idx);

            // generate D
            var idxD = [];
            for (var _i2 = 0; _i2 < n; _i2++) {
                idxD.push(_i2);
                idxD.push(n * (n - 1) + _i2);
            }
            for (var _i3 = 1; _i3 < n - 1; _i3++) {
                idxD.push(n * _i3);
                idxD.push(n * _i3 + n - 1);
            }
            ILTL.removeByValue(idxD, posDicC[randC]);
            // let randD = parseInt(idxD.length*Math.random());
            var randD = 5;
            // console.log('randD: ' + randD);
            // console.log(idxD.length);
            mat[idxD[randD]] = 'D';
            // console.log(idxD[randD]);
            ILTL.removeByValue(idx, idxD[randD]);
            // console.log(idx);

            //generate A B
            // let randA = parseInt((n*n-2)*Math.random());
            var randA = 10;
            // console.log('randA: ' + randA);
            mat[idx[randA]] = 'A';
            // console.log(idx[randA]);
            ILTL.removeByValue(idx, idx[randA]);
            // console.log(idx);

            // let randB = parseInt((n*n-3)*Math.random());
            var randB = 15;
            // console.log('randB: ' + randB);
            // console.log(idx[randB]);

            // console.log(idx);
            mat[idx[randB]] = 'B';
            ILTL.removeByValue(idx, idx[randB]);

            this.mat = mat;
            return mat;
        }
    }, {
        key: 'printMatrix',
        value: function printMatrix() {
            var n = this.matrixSize;
            for (var i = 0; i < n; i++) {
                var str = '';
                for (var j = 0; j < n; j++) {
                    str += this.mat[i * n + j] + ' ';
                }
                console.log(str);
            }
        }
    }], [{
        key: 'removeByValue',
        value: function removeByValue(arr, val) {
            for (var i = arr.length - 1; i >= 0; i--) {
                if (arr[i] === val) {
                    arr.splice(i, 1);
                    break;
                }
            }
        }
    }]);

    return ILTL;
}();

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGFwcC5qcyIsInNyY1xcanNcXExUTF9pbnRlcmFjdGl2ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUE7O0FBRUEsSUFBSSxRQUFRLDJCQUFaO0FBQ0EsTUFBTSxjQUFOO0FBQ0EsTUFBTSxXQUFOOzs7Ozs7Ozs7Ozs7O0lDSk0sSTtBQUNGLGtCQUFZLEVBQVosRUFBZ0IsR0FBaEIsRUFBOEU7QUFBQSxZQUF6RCxFQUF5RCx1RUFBcEQsSUFBb0Q7QUFBQSxZQUE5QyxFQUE4Qyx1RUFBekMsSUFBeUM7QUFBQSxZQUFuQyxFQUFtQyx1RUFBOUIsSUFBOEI7QUFBQSxZQUF4QixPQUF3Qix1RUFBZCxDQUFjO0FBQUEsWUFBWCxLQUFXLHVFQUFILENBQUc7O0FBQUE7O0FBQzFFLGFBQUssRUFBTCxHQUFVLEVBQVYsQ0FEMEUsQ0FDM0Q7QUFDZixhQUFLLEdBQUwsR0FBVyxHQUFYO0FBQ0EsYUFBSyxFQUFMLEdBQVUsRUFBVjtBQUNBLGFBQUssRUFBTCxHQUFVLEVBQVY7QUFDQSxhQUFLLEVBQUwsR0FBVSxFQUFWO0FBQ0EsYUFBSyxLQUFMLEdBQWEsQ0FBYjtBQUNBLGFBQUssT0FBTCxHQUFlLE9BQWY7QUFDQSxhQUFLLEtBQUwsR0FBYSxLQUFiOztBQUVBLFlBQUksS0FBSyxFQUFMLEtBQVksQ0FBaEIsRUFBbUI7QUFDZixvQkFBUSxLQUFLLEdBQWI7QUFDSSxxQkFBSyxHQUFMO0FBQ0kseUJBQUssS0FBTCxHQUFhLEtBQUssQ0FBbEI7QUFDQTtBQUNKLHFCQUFLLEdBQUw7QUFDSSx5QkFBSyxLQUFMLEdBQWEsS0FBSyxDQUFsQjtBQUNBO0FBQ0oscUJBQUssR0FBTDtBQUNJLHlCQUFLLEtBQUwsR0FBYSxLQUFLLENBQWxCO0FBQ0E7QUFDSixxQkFBSyxHQUFMO0FBQ0kseUJBQUssS0FBTCxHQUFhLENBQWI7QUFDQTtBQVpSO0FBY0g7QUFDSjs7Ozs4QkFF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Q1YsZ0JBQUksSUFBSSxLQUFLLFVBQWI7QUFDSixpQkFBSyxJQUFJLElBQUUsQ0FBWCxFQUFjLElBQUUsQ0FBaEIsRUFBbUIsR0FBbkIsRUFBd0I7QUFDcEIsb0JBQUksTUFBTSxFQUFWO0FBQ0EscUJBQUssSUFBSSxJQUFFLENBQVgsRUFBYyxJQUFFLENBQWhCLEVBQW1CLEdBQW5CLEVBQXdCO0FBQ3BCLDJCQUFNLEtBQUssR0FBTCxDQUFTLElBQUUsQ0FBRixHQUFJLENBQWIsSUFBa0IsR0FBeEI7QUFDSDtBQUNELHdCQUFRLEdBQVIsQ0FBWSxHQUFaO0FBQ0g7QUFDSjs7O3NDQUV3QixHLEVBQUssRyxFQUFLO0FBQy9CLGlCQUFJLElBQUksSUFBRSxJQUFJLE1BQUosR0FBVyxDQUFyQixFQUF3QixLQUFHLENBQTNCLEVBQThCLEdBQTlCLEVBQW1DO0FBQy9CLG9CQUFHLElBQUksQ0FBSixNQUFXLEdBQWQsRUFBbUI7QUFDZix3QkFBSSxNQUFKLENBQVcsQ0FBWCxFQUFjLENBQWQ7QUFDQTtBQUNIO0FBQ0o7QUFDSiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJpbXBvcnQge0lMVEx9IGZyb20gJy4vanMvTFRMX2ludGVyYWN0aXZlJztcclxuXHJcbmxldCBhZ2VudCA9IG5ldyBJTFRMKCk7XHJcbmFnZW50LmdlbmVyYXRlTWF0cml4KCk7XHJcbmFnZW50LnByaW50TWF0cml4KCk7XHJcbiIsImNsYXNzIE5vZGUge1xyXG4gICAgY29uc3RydWN0b3Iob3AsIHZhbCwgbGMgPSBudWxsLCByYyA9IG51bGwsIHBhID0gbnVsbCwgY29tcGxleCA9IDAsIGF0b21zID0gMCkge1xyXG4gICAgICAgIHRoaXMub3AgPSBvcDsgIC8vIDAgZm9yIG9wZXJhbmRzLCAxIGZvciBzaW5nbGUgb3BlcmF0b3IsIDIgZm9yIGJpIG9wZXJhdG9yXHJcbiAgICAgICAgdGhpcy52YWwgPSB2YWw7XHJcbiAgICAgICAgdGhpcy5sYyA9IGxjO1xyXG4gICAgICAgIHRoaXMucmMgPSByYztcclxuICAgICAgICB0aGlzLnBhID0gcGE7XHJcbiAgICAgICAgdGhpcy5kZXB0aCA9IDE7XHJcbiAgICAgICAgdGhpcy5jb21wbGV4ID0gY29tcGxleDtcclxuICAgICAgICB0aGlzLmF0b21zID0gYXRvbXM7XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wID09PSAwKSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAodGhpcy52YWwpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ0EnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXRvbXMgPSAxIDw8IDM7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdCJzpcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmF0b21zID0gMSA8PCAyO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnQyc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hdG9tcyA9IDEgPDwgMTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ0QnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYXRvbXMgPSAxO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGFkZExjKG5vZGUpIHtcclxuICAgICAgICB0aGlzLmxjID0gbm9kZTtcclxuICAgICAgICB0aGlzLmRlcHRoID0gTWF0aC5tYXgodGhpcy5kZXB0aCwgbm9kZS5kZXB0aCArIDEpO1xyXG4gICAgICAgIG5vZGUucGEgPSB0aGlzO1xyXG4gICAgICAgIGxldCBjbnQgPSAwO1xyXG4gICAgICAgIGlmICghIXRoaXMubGMpIGNudCArPSB0aGlzLmxjLmNvbXBsZXg7XHJcbiAgICAgICAgaWYgKCEhdGhpcy5yYykgY250ICs9IHRoaXMucmMuY29tcGxleDtcclxuICAgICAgICB0aGlzLmNvbXBsZXggPSBjbnQgKyAxO1xyXG4gICAgICAgIHRoaXMuYXRvbXMgfD0gdGhpcy5sYy5hdG9tcztcclxuICAgIH1cclxuXHJcbiAgICBhZGRSYyhub2RlKSB7XHJcbiAgICAgICAgdGhpcy5yYyA9IG5vZGU7XHJcbiAgICAgICAgdGhpcy5kZXB0aCA9IE1hdGgubWF4KHRoaXMuZGVwdGgsIG5vZGUuZGVwdGggKyAxKTtcclxuICAgICAgICBub2RlLnBhID0gdGhpcztcclxuICAgICAgICBsZXQgY250ID0gMDtcclxuICAgICAgICBpZiAoISF0aGlzLmxjKSBjbnQgKz0gdGhpcy5sYy5jb21wbGV4O1xyXG4gICAgICAgIGlmICghIXRoaXMucmMpIGNudCArPSB0aGlzLnJjLmNvbXBsZXg7XHJcbiAgICAgICAgdGhpcy5jb21wbGV4ID0gY250ICsgMTtcclxuICAgICAgICB0aGlzLmF0b21zIHw9IHRoaXMucmMuYXRvbXM7XHJcbiAgICB9XHJcblxyXG4gICAgcmVwbGljYXRlKCkge1xyXG4gICAgICAgIGxldCByZXMgPSBuZXcgTm9kZSh0aGlzLm9wLCB0aGlzLnZhbCwgdGhpcy5sYywgdGhpcy5yYywgdGhpcy5wYSwgdGhpcy5jb21wbGV4LCB0aGlzLmF0b21zKTtcclxuICAgICAgICBpZiAoISFyZXMubGMpIHtcclxuICAgICAgICAgICAgcmVzLmxjID0gcmVzLmxjLnJlcGxpY2F0ZSgpO1xyXG4gICAgICAgICAgICByZXMubGMucGEgPSByZXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghIXJlcy5yYykge1xyXG4gICAgICAgICAgICByZXMucmMgPSByZXMucmMucmVwbGljYXRlKCk7XHJcbiAgICAgICAgICAgIHJlcy5yYy5wYSA9IHJlcztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH1cclxuXHJcbiAgICBlcXVhbChub2RlKSB7XHJcbiAgICAgICAgaWYgKHRoaXMudmFsICE9PSBub2RlLnZhbCkgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIGlmICh0aGlzLm9wID09PSAwICYmIHRoaXMudmFsID09PSBub2RlLnZhbCkgcmV0dXJuIHRydWU7XHJcblxyXG4gICAgICAgIGxldCByZXNMID0gdHJ1ZSwgcmVzUiA9IHRydWU7XHJcblxyXG4gICAgICAgIGlmICghIXRoaXMubGMpIHtcclxuICAgICAgICAgICAgaWYgKCEhbm9kZS5sYykgcmVzTCA9IHRoaXMubGMuZXF1YWwobm9kZS5sYyk7XHJcbiAgICAgICAgICAgIGVsc2UgcmVzTCA9IGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlc0wgPSAhbm9kZS5sYztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICghIXRoaXMucmMpIHtcclxuICAgICAgICAgICAgaWYgKCEhbm9kZS5yYykgcmVzUiA9IHRoaXMucmMuZXF1YWwobm9kZS5yYyk7XHJcbiAgICAgICAgICAgIGVsc2UgcmVzUiA9IGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHJlc1IgPSAhbm9kZS5yYztcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXNMICYmIHJlc1I7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpbnQobG9nID0gdHJ1ZSkge1xyXG4gICAgICAgIGlmICh0aGlzLm9wID09PSAwKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5wYSlcclxuICAgICAgICAgICAgICAgIGlmIChsb2cpIGNvbnNvbGUubG9nKHRoaXMudmFsKTtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmFsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHJlcyA9ICcnO1xyXG4gICAgICAgIGlmICh0aGlzLm9wID09PSAyKVxyXG4gICAgICAgICAgICByZXMgPSAnKCcgKyB0aGlzLmxjLnByaW50KCkgKyAnICcgKyB0aGlzLnZhbCArICcgJyArIHRoaXMucmMucHJpbnQoKSArICcpJztcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3AgPT09IDEpXHJcbiAgICAgICAgICAgIHJlcyA9IHRoaXMudmFsICsgJyAnICsgdGhpcy5sYy5wcmludCgpO1xyXG5cclxuICAgICAgICBpZiAoIXRoaXMucGEpXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBpZiAobG9nKVxyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzICsgJyAnICsgdGhpcy5jb21wbGV4KTtcclxuICAgICAgICAgICAgcmV0dXJuIHJlcztcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgfVxyXG5cclxuICAgIGdldFF1YWRUdXBsZSgpIHtcclxuICAgICAgICBsZXQgcmVzID0geydBJzpudWxsLCAnQic6bnVsbCwgJ0MnOm51bGwsICdEJzpudWxsfTtcclxuICAgICAgICBpZiAodGhpcy5vcCA9PT0gMCkge1xyXG4gICAgICAgICAgICByZXNbdGhpcy52YWxdID0ge21hcms6MSwgcG93OjB9O1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKCEhdGhpcy5sYykge1xyXG4gICAgICAgICAgICBsZXQgbFJlcyA9IHRoaXMubGMuZ2V0UXVhZFR1cGxlKCk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiBsUmVzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzW2tleV0gPT09IG51bGwpIHJlc1trZXldID0gbFJlc1trZXldO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5yYykge1xyXG4gICAgICAgICAgICBsZXQgclJlcyA9IHRoaXMucmMuZ2V0UXVhZFR1cGxlKCk7XHJcbiAgICAgICAgICAgIGZvciAobGV0IGtleSBpbiByUmVzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAocmVzW2tleV0gPT09IG51bGwpIHJlc1trZXldID0gclJlc1trZXldO1xyXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAoclJlc1trZXldICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVzW2tleV0ubWFyayAqPSByUmVzW2tleV0ubWFyaztcclxuICAgICAgICAgICAgICAgICAgICByZXNba2V5XS5wb3cgKz0gclJlc1trZXldLnBvdztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgZm9yIChsZXQga2V5IGluIHJlcykge1xyXG4gICAgICAgICAgICBpZiAocmVzW2tleV0gIT09IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnZhbCA9PT0gJ2V2ZW50dWFsbHknKSByZXNba2V5XS5wb3crKztcclxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHRoaXMudmFsID09PSAnbm90JykgcmVzW2tleV0ubWFyayAqPSAtMTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlcztcclxuICAgIH1cclxufVxyXG5leHBvcnQgY2xhc3MgSUxUTCB7XHJcbiAgICBjb25zdHJ1Y3RvcihzZXR0aW5ncykge1xyXG4gICAgICAgIC8vIGRlZmF1bHQgc2V0dGluZ3NcclxuICAgICAgICBPYmplY3QuYXNzaWduKHRoaXMsIHtcclxuICAgICAgICAgICAgLy8gY29uc3RhbnRzXHJcbiAgICAgICAgICAgIG1pdTogMC4wMDAwMSxcclxuICAgICAgICAgICAgdGhldGE6IDAuMDAwMDEsXHJcbiAgICAgICAgICAgIGJldGE6IDAuNSxcclxuICAgICAgICAgICAgYWxwaGE6IDAuNSxcclxuICAgICAgICAgICAgbWF0cml4U2l6ZTogNSxcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIC8vIHZhcmlhYmxlc1xyXG4gICAgICAgICAgICBtYXQ6IFtdLFxyXG4gICAgICAgICAgICByb290czogW10sXHJcbiAgICAgICAgICAgIGRlZmF1bHRUYXNrOiBbXHJcbiAgICAgICAgICAgICAgICBuZXcgTm9kZSgwLCAnQScsIG51bGwsIG51bGwsIG51bGwpLFxyXG4gICAgICAgICAgICAgICAgbmV3IE5vZGUoMCwgJ0InLCBudWxsLCBudWxsLCBudWxsKSxcclxuICAgICAgICAgICAgICAgIG5ldyBOb2RlKDAsICdDJywgbnVsbCwgbnVsbCwgbnVsbCksXHJcbiAgICAgICAgICAgICAgICBuZXcgTm9kZSgwLCAnRCcsIG51bGwsIG51bGwsIG51bGwpLFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBmZWVkYmFja1RhYmxlOiBbXSxcclxuICAgICAgICAgICAgbGVhcm5kVGFzazogbnVsbCxcclxuICAgICAgICAgICAgdGFyZ2V0VGFzazogbnVsbCxcclxuICAgICAgICAgICAgY3VycmVudFRhc2s6IG51bGxcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBjdXN0b21pemVkIHNldHRpbmdzIG92ZXJyaWRlXHJcbiAgICAgICAgT2JqZWN0LmFzc2lnbih0aGlzLCBzZXR0aW5ncyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGVNYXRyaXgoKSB7XHJcbiAgICAgICAgbGV0IG4gPSB0aGlzLm1hdHJpeFNpemU7XHJcbiAgICAgICAgbGV0IG1hdCA9IFtdO1xyXG4gICAgICAgIGxldCBpZHggPSBbXTtcclxuICAgICAgICBmb3IgKGxldCBpPTA7IGk8bipuOyBpKyspIGlkeC5wdXNoKGkpO1xyXG4gICAgXHJcbiAgICAgICAgZm9yIChsZXQgaT0wOyBpPG47IGkrKykge1xyXG4gICAgICAgICAgICBmb3IgKGxldCBqPTA7IGo8bjsgaisrKSB7XHJcbiAgICAgICAgICAgICAgICBtYXRbaSpuK2pdID0gJ04nO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgLy8gZ2VuZXJhdGUgQyBwb3NpdGlvblxyXG4gICAgICAgIC8vIGxldCByYW5kQyA9IHBhcnNlSW50KDQqTWF0aC5yYW5kb20oKSk7XHJcbiAgICAgICAgbGV0IHJhbmRDID0gMTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygncmFuZEM6ICcgKyByYW5kQyk7XHJcbiAgICAgICAgY29uc3QgcG9zRGljQyA9IFswLCBuLTEsIG4qKG4tMSksIG4qbi0xXTtcclxuICAgICAgICBtYXRbcG9zRGljQ1tyYW5kQ11dID0gJ0MnO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKHBvc0RpY0NbcmFuZENdKTtcclxuICAgICAgICBJTFRMLnJlbW92ZUJ5VmFsdWUoaWR4LCBwb3NEaWNDW3JhbmRDXSk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coaWR4KTtcclxuICAgIFxyXG4gICAgICAgIC8vIGdlbmVyYXRlIERcclxuICAgICAgICBsZXQgaWR4RCA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IGk9MDsgaTxuOyBpKyspIHtcclxuICAgICAgICAgICAgaWR4RC5wdXNoKGkpO1xyXG4gICAgICAgICAgICBpZHhELnB1c2gobioobi0xKStpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yIChsZXQgaT0xOyBpPG4tMTsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlkeEQucHVzaChuKmkpO1xyXG4gICAgICAgICAgICBpZHhELnB1c2gobippK24tMSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIElMVEwucmVtb3ZlQnlWYWx1ZShpZHhELCBwb3NEaWNDW3JhbmRDXSk7XHJcbiAgICAgICAgLy8gbGV0IHJhbmREID0gcGFyc2VJbnQoaWR4RC5sZW5ndGgqTWF0aC5yYW5kb20oKSk7XHJcbiAgICAgICAgbGV0IHJhbmREID0gNTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygncmFuZEQ6ICcgKyByYW5kRCk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coaWR4RC5sZW5ndGgpO1xyXG4gICAgICAgIG1hdFtpZHhEW3JhbmREXV0gPSAnRCc7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coaWR4RFtyYW5kRF0pO1xyXG4gICAgICAgIElMVEwucmVtb3ZlQnlWYWx1ZShpZHgsIGlkeERbcmFuZERdKTtcclxuICAgICAgICAvLyBjb25zb2xlLmxvZyhpZHgpO1xyXG4gICAgXHJcbiAgICAgICAgLy9nZW5lcmF0ZSBBIEJcclxuICAgICAgICAvLyBsZXQgcmFuZEEgPSBwYXJzZUludCgobipuLTIpKk1hdGgucmFuZG9tKCkpO1xyXG4gICAgICAgIGxldCByYW5kQSA9IDEwO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdyYW5kQTogJyArIHJhbmRBKTtcclxuICAgICAgICBtYXRbaWR4W3JhbmRBXV0gPSAnQSc7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coaWR4W3JhbmRBXSk7XHJcbiAgICAgICAgSUxUTC5yZW1vdmVCeVZhbHVlKGlkeCwgaWR4W3JhbmRBXSk7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coaWR4KTtcclxuICAgIFxyXG4gICAgICAgIC8vIGxldCByYW5kQiA9IHBhcnNlSW50KChuKm4tMykqTWF0aC5yYW5kb20oKSk7XHJcbiAgICAgICAgbGV0IHJhbmRCID0gMTU7XHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coJ3JhbmRCOiAnICsgcmFuZEIpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKGlkeFtyYW5kQl0pO1xyXG4gICAgXHJcbiAgICAgICAgLy8gY29uc29sZS5sb2coaWR4KTtcclxuICAgICAgICBtYXRbaWR4W3JhbmRCXV0gPSAnQic7XHJcbiAgICAgICAgSUxUTC5yZW1vdmVCeVZhbHVlKGlkeCwgaWR4W3JhbmRCXSk7XHJcblxyXG4gICAgICAgIHRoaXMubWF0ID0gbWF0O1xyXG4gICAgICAgIHJldHVybiBtYXQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpbnRNYXRyaXgoKSB7XHJcbiAgICAgICAgbGV0IG4gPSB0aGlzLm1hdHJpeFNpemU7XHJcbiAgICBmb3IgKGxldCBpPTA7IGk8bjsgaSsrKSB7XHJcbiAgICAgICAgbGV0IHN0ciA9ICcnO1xyXG4gICAgICAgIGZvciAobGV0IGo9MDsgajxuOyBqKyspIHtcclxuICAgICAgICAgICAgc3RyKz0gdGhpcy5tYXRbaSpuK2pdICsgJyAnO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zb2xlLmxvZyhzdHIpO1xyXG4gICAgfVxyXG59XHJcblxyXG4gICAgc3RhdGljIHJlbW92ZUJ5VmFsdWUoYXJyLCB2YWwpIHtcclxuICAgIGZvcihsZXQgaT1hcnIubGVuZ3RoLTE7IGk+PTA7IGktLSkge1xyXG4gICAgICAgIGlmKGFycltpXSA9PT0gdmFsKSB7XHJcbiAgICAgICAgICAgIGFyci5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG59Il19

//# sourceMappingURL=maps/app.js.map
