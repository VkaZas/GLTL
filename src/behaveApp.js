import {LTLNode, LTLEngine} from '../behave/LTLNode';
import {GridPainter} from './js/GridPainter';
import $ from 'jquery';

let sample = LTLEngine.sampleTask4();
let engine = new LTLEngine();
let nowPos = 0;
let painter = new GridPainter($('#grid-container'), {
    clickCallBack: (index) => {
        engine.setAgentPosition(index);
        engine.setTargetLTL(sample);
        painter.setAndroid(index);
    }
});

let btnMv1 = $('#btn-mv1');
let btnMv5 = $('#btn-mv5');
let btnMv10 = $('#btn-mv10');
let btnMv100 = $('#btn-mv100');
let btnMv = $('#btn-mv');
let taskList = [LTLEngine.sampleTask1(), LTLEngine.sampleTask2(), LTLEngine.sampleTask3(), LTLEngine.sampleTask4(), LTLEngine.sampleTask5()];

btnMv1.click(() => {
    moveAndroidSteps(1);
});

btnMv5.click(() => {
    moveAndroidSteps(5);
});

btnMv10.click(() => {
    moveAndroidSteps(10);
});

btnMv100.click(() => {
    moveAndroidSteps(100);
});

btnMv.click(() => {
    moveAndroidSteps(1000);
});

$(document).ready(() => {
    window.LTLNode = LTLNode;
    window.LTLEngine = LTLEngine;

    window.engine = engine;

    engine.setTargetLTL(sample);

    painter.paintGrid();
    painter.paintMatrix(engine.mat);
    painter.setAndroid(0);
});

function moveAndroidSteps(steps) {
    for (let i = 0; i < steps; i++) {
        let [nxtPos, ] = engine.getAgentNextMove(engine.nowPos, engine.nowTask);
        engine.moveAgentSteps(1);
        if (nxtPos === nowPos) {
            continue;
        }
        painter.moveAndroid(nxtPos, () => {

        });
        cleanLog();
        log('My goal: ' + engine.targetLTL.toString());
        log('My current task: ' + engine.nowTask.toString());
        log('I have been to: ' +engine.nowHistory);
        setTimeout(() => {}, 500);
        nowPos = nxtPos;
    }
}

function changeTask(idx) {
    engine.setTargetLTL(taskList[idx], false);
    painter.setAndroid(0);
}

function changePosition(pos) {
    engine.setAgentPosition(pos);
    painter.setAndroid(pos);
}

function log(str, color = 'white') {
    let $p = $('<p>' + str + '</p>'),
        $logger = $('#logger'),
        $logs = $('#logger-logs');
    $p.css('color', color);
    $logs.append($p);
    let deltaH = $logs.height() - $logger.height();
    $logger.scrollTop(deltaH > -40 ? deltaH + 40 : 0);
}

function cleanLog() {
    let $logs = $('#logger-logs');
    $logs.empty();
}

window.moveAndroidSteps = moveAndroidSteps;
window.changeTask = changeTask;
window.changePosition = changePosition;