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
            width: this.androidSize + 'px'
        });

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

    paintChar(index, char = '?') {
        let $grid = this.gridList[index];
        $grid.append('<span>' + char + '</span>');
    }

    gridClicked(index) {
        if (!!this.clickCallBack)
            this.clickCallBack(index);
        console.log(index);
    }

    getGridPos(index) {
        let $grid = this.gridList[index];
        let $row = $grid.parent('.grid-row');
        return {
            x: $grid.position().left,
            y: $grid.position().top
        }
    }

    setAndroid(index) {
        let pos = this.getGridPos(index);
        this.android.css({
            top: pos.y + (this.gridSize - this.androidSize) / 2 + 'px',
            left: 5 + pos.x + (this.gridSize - this.androidSize) / 2 + 'px'
        });
        this.container.append(this.android);
    }

    moveAndroid(destIdx) {
        let destPos = this.getGridPos(destIdx);
        this.android.animate({
            top: destPos.y + (this.gridSize - this.androidSize) / 2 + 'px',
            left: 5 + destPos.x + (this.gridSize - this.androidSize) / 2 + 'px'
        }, 500, 'linear', this.displayMessage)
    }

    displayMessage() {

    }
}