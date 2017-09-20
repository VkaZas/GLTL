import {ILTL} from './js/LTL_interactive';
import {GridPainter} from './js/GridPainter';
import $ from 'jquery';

let agent = new ILTL();
agent.generateMatrix();
agent.printMatrix();

let painter = new GridPainter($('#grid-container'));
painter.paintGrid();
painter.paintChar(5, 'A');
painter.setAndroid(13);
window.painter = painter;