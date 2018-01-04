import $ from 'jquery';

export class GridPainter {
    constructor($container, option) {
        if (!$container)
            console.error('GridPainter.constructor(): $container cannot be empty.');
        this.container = $container;
        this.gridList = [];
        this.gridSize = 100;
        this.width = 5;
        this.height = 5;
        this.clickCallBack = null;
        this.androidSize = 75;
        this.android = $('<div></div>').addClass('grid-android').css({
            height: this.androidSize + 'px',
            width: this.androidSize + 'px',
            'background-image' : 'url(/static/bot.jpg)',
            'background-size' : 'contain'
        });
        this.freeze = false;

        Object.assign(this, option);

        // init
        this.container.addClass('grid-container');
    }

    paintGrid() {
        this.container.empty();
        this.gridList = [];

        for (let h = 0; h < this.height; h++) {
            let $row = $('<div></div>');
            $row.addClass('grid-row').attr('data-row', h);
            this.container.append($row);

            for (let w = 0; w < this.width; w++) {
                let $grid = $('<div></div>'), gridIndex = h * this.width + w;
                $grid.addClass('grid').attr('data-grid', gridIndex)
                    .click(() => {
                        this.gridClicked(gridIndex);
                    })
                    .css({
                        height: this.gridSize + 'px',
                        width: this.gridSize + 'px',
                        'line-height': this.gridSize + 'px'
                    });
                this.gridList.push($grid);
                $row.append($grid);
            }
        }
    }

    _paintChar(index, char = '?') {
        let $grid = this.gridList[index];
        $grid.append('<span>' + char + '</span>');
    }

    paintMatrix(mat) {
        this.container.find('span').remove();
        for (let i = 0; i < this.height; i++)
            for (let j = 0; j < this.width; j++) {
                let index = i * this.width + j;
                if (mat[index] === 'A' || mat[index] === 'B' ||
                    mat[index] === 'C' || mat[index] === 'D') {
                    // this._paintChar(index, mat[index]);
                    let $grid = this.gridList[index];
                    $grid.css({
                        'background-image': 'url(/static/material_' + mat[index] + '.jpg)',
                        'background-size' : 'contain'
                    });
                } else {
                    let $grid = this.gridList[index];
                    $grid.css({
                        'background-image': 'url(/static/material.jpg)',
                        'background-size' : 'contain'
                    });
                }
            }
    }

    gridClicked(index) {
        if (this.freeze) return;
        if (!!this.clickCallBack)
            this.clickCallBack(index);
    }

    _getGridPos(index) {
        // console.log('[_getGridPos]: index = ' + index);

        let $grid = this.gridList[index];
        return {
            x: $grid.position().left,
            y: $grid.position().top
        }
    }

    setAndroid(index) {
        let pos = this._getGridPos(index);
        this.android.css({
            top: pos.y + (this.gridSize - this.androidSize) / 2 + 'px',
            left: 5 + pos.x + (this.gridSize - this.androidSize) / 2 + 'px'
        });
        this.container.append(this.android);
    }

    clearAndroid() {
        this.container.find('.grid-android').remove();
    }

    moveAndroid(destIdx, cb = () => {}) {
        if (destIdx < 0) {
            if (destIdx === -2) this.setAndroidEmotion(0);
            else if (destIdx === -3) this.setAndroidEmotion(1);
            return;
        }
        let destPos = this._getGridPos(destIdx);
        this.android.animate({
            top: destPos.y + (this.gridSize - this.androidSize) / 2 + 'px',
            left: 5 + destPos.x + (this.gridSize - this.androidSize) / 2 + 'px'
        }, 500, 'linear', cb)
    }

    displayMessage() {

    }

    freezePainter() {
        this.freeze = true;
    }

    unfreezePainter() {
        this.freeze = false;
    }

    setAndroidEmotion(emotion = 0) {
        let clr = 'green';
        if (emotion === 0) clr = 'green';
        else if(emotion === 1) clr = 'red';
        else clr = 'orange';
        this.android.css('border', `1px solid ${clr}`)
    }
}