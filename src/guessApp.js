import {LTLNode, LTLEngine} from '../behave/LTLNode';
import {GridPainter} from './js/GridPainter';
import $ from 'jquery';

const taskList = [LTLEngine.sampleTask1(), LTLEngine.sampleTask2(), LTLEngine.sampleTask3(), LTLEngine.sampleTask4(), LTLEngine.sampleTask5()];
const guessMaxStep = 10;
let currentTaskIdx = 0;
let nowPos = 0;
let rightNowPos = 0;
let nowTips = '';
let guessPath = '';
let truePath = '';
let guessMode = false;
let guessStep = 0;
let engineLeft = new LTLEngine();
let engineRight = new LTLEngine();
let painterLeft = new GridPainter($('#watch-container'));
let painterRight = new GridPainter($('#guess-container'));

// Buttons
let btnMove = $('#btn-move');
let btnChangeTask = $('#btn-change-task');
let btnChangeMap = $('#btn-change-Map');
let btnTips = $('#btn-tips');
let btnGuess = $('#btn-guess');

let title = $('#title');

btnMove.click(() => {
    moveAndroidSteps(1);
});

btnChangeTask.click(() => {
    currentTaskIdx = (currentTaskIdx + 1) % 5;
    initTask(currentTaskIdx);
});

btnChangeMap.click(() => {
    initTask(currentTaskIdx);
});

btnGuess.click(() => {
    initGuess(currentTaskIdx);
});

btnTips.click(() => {
    $('#tips').html(nowTips);
});

$(document).ready(() => {
    initApp();
});

$(document).keydown((e) => {
    if (!guessMode) return;
    let p = rightNowPos;
    switch (e.which) {
        case 37:
            if ((p % 5) !== 0) guessNext(p - 1);
            console.log('left');
            break;
        case 38:
            if (p > 4) guessNext(p - 5);
            console.log('up');
            break;
        case 39:
            if ((p % 5) !== 4) guessNext(p + 1);
            console.log('right');
            break;
        case 40:
            if (p < 20) guessNext(p + 5);
            console.log('bot');
            break;
    }
});

function guessNext(pos) {
    painterRight.moveAndroid(pos);
    guessPath += ' ' + pos;
    rightNowPos = pos;
    guessStep++;
    if (guessStep === guessMaxStep)
        alert('GuessPath: ' + guessPath + '\n' + 'TruePath: ' + truePath);
    console.log('GuessPath: ' + guessPath);
    console.log('TruePath: ' + truePath);
}

function initApp() {
    painterLeft.paintGrid();
    painterRight.paintGrid();
    initTask(currentTaskIdx);
}

function initTask(taskIdx, posLeft = 0) {
    title.html('Task ' + taskIdx);
    guessMode = false;
    nowPos = posLeft;
    engineLeft.setTargetLTL(taskList[taskIdx]);
    engineLeft.setAgentPosition(posLeft);

    painterLeft.paintMatrix(engineLeft.mat);
    painterLeft.setAndroid(posLeft);
}

function initGuess(taskIdx, posRight = 0) {
    guessStep = 0;
    rightNowPos = posRight;
    guessPath = '' + taskIdx;
    guessMode = true;
    engineRight.setTargetLTL(taskList[taskIdx]);
    engineRight.setAgentPosition(posRight);

    painterRight.paintMatrix(engineRight.mat);
    painterRight.setAndroid(posRight);

    truePath = calcAndroidPath(guessMaxStep);
}

function moveAndroidSteps(steps) {
    for (let i = 0; i < steps; i++) {
        let [logs, nxtPos] = engineLeft.moveAgentSteps(1);
        if (nxtPos === nowPos) {
            continue;
        }
        painterLeft.moveAndroid(nxtPos, () => {

        });
        setTimeout(() => {}, 500);
        nowPos = nxtPos;
    }
    nowTips = 'Current Task: ' + engineLeft.nowTask.toString();
}

function calcAndroidPath(steps) {
    let nowPos = rightNowPos;
    let res = nowPos + '';
    for (let i = 0; i < steps; i++) {
        let [logs, nxtPos] = engineRight.moveAgentSteps(1);
        if (nxtPos === nowPos) {
            continue;
        }
        nowPos = nxtPos;
        res += ' ' + nxtPos;
    }
    return res;
}