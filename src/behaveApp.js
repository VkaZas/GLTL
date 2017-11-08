import {LTLNode, LTLEngine} from '../behave/LTLNode';
import {GridPainter} from './js/GridPainter';
import $ from 'jquery';

let sample = LTLEngine.sampleTaskNext();
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
let btnTask1 = $('#btn-task1');
let btnTask2 = $('#btn-task2');
let btnTask3 = $('#btn-task3');
let btnTask4 = $('#btn-task4');
let btnTask5 = $('#btn-task5');

btnTask1.click(() => {
    changeTask(0);
});

btnTask2.click(() => {
    changeTask(1);
});

btnTask3.click(() => {
    changeTask(2);
});

btnTask4.click(() => {
    changeTask(3);
});

btnTask5.click(() => {
    changeTask(4);
});

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
        let logs = engine.moveAgentSteps(1);
        if (nxtPos === nowPos) {
            continue;
        }
        painter.moveAndroid(nxtPos, () => {

        });
        cleanLog();
        log('My goal: ' + engine.targetLTL.toString(), 'skyblue');
        log('My current task: ' + engine.nowTask.toString());
        for (let logItem of logs) {
            log(logItem, 'lightgreen');
        }
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