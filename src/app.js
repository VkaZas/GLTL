import {ILTL} from './js/LTL_interactive';
import {GridPainter} from './js/GridPainter';
import $ from 'jquery';

$(document).ready(() => {
    let s0, s1, replacing = false;
    let agent = new ILTL({
        targetTask: ILTL.task4(),
        deadendCallback: (index) => {
            log('Reached deadend, repositioning randomly: ' + index);
            painter.setAndroid(index);
            s0 = index;
        }
    });
    let painter = new GridPainter($('#grid-container'), {
        clickCallBack: (index) => {
            if (!replacing) agent.initSubTask();
            log('Learning : ' + agent.currentTask.print(), 'red');
            s0 = index;
            s1 = agent.calcNextMove(s0);
            console.log('[clickCallBack]: s1 = ', s1);
            painter.setAndroid(s0);
            painter.moveAndroid(s1.s1);
            log(s0 + '->' + s1.s1 + ':' + s1.term);
            painter.freezePainter();
        }
    });

    let $btnPositive = $('#btn-positive');
    let $btnNegative = $('#btn-negative');
    let $btnReplace = $('#btn-replace');

    $btnPositive.click(() => {
        let res = agent.filterByFeedback(true, s1);
        if (res === 0) {
            s0 = s1;
            s1 = agent.calcNextMove(s0.s1);
            if (s1.s1 !== -1) {
                painter.moveAndroid(s1.s1);
                log(s0.s1 + '->' + s1.s1 + ':' + s1.term);
            } else {

            }

        } else {
            log('Task learned : ' + res.print(), 'limegreen');
            log('Please place your agent.', 'limegreen');
            painter.unfreezePainter();
            replacing = false;
        }
    });

    $btnNegative.click(() => {
        let res = agent.filterByFeedback(false, s1);
        if (res === 0) {
            s0 = s1;
            s1 = agent.calcNextMove(s0.s1);
            if (s1.s1 !== -1) {
                painter.moveAndroid(s1.s1);
                log(s0.s1 + '->' + s1.s1 + ':' + s1.term);
            } else {
            }
        } else {
            log('Task learned : ' + res.print(), 'limegreen');
            log('Please place your agent.', 'limegreen');
            painter.unfreezePainter();
            replacing = false;
        }
    });

    $btnReplace.click(() => {
        painter.clearAndroid();
        painter.unfreezePainter();
        replacing = true;
    });

    agent.init();
    painter.paintGrid();
    painter.paintMatrix(agent.mat);

    log('Please place your agent.', 'limegreen');

    window.painter = painter;
    window.agent = agent;
});

function log(str, color = 'white') {
    let $p = $('<p>' + str + '</p>');
    let $logger = $('#logger');
    $p.css('color', color);
    $logger.append($p);
    $logger.scrollTop($logger.find('p').length * 300);
}





