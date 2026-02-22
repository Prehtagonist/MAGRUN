class LaneManager {
    constructor(containerWidth) {
        this.lanes = [];
        this.containerWidth = containerWidth;
        this.setupLanes();
    }

    setupLanes() {
        const laneWidth = this.containerWidth / 3;
        this.lanes = [
            laneWidth * 0.5,
            laneWidth * 1.5,
            laneWidth * 2.5
        ];
    }

    getLanePosition(index) {
        if (index < 0 || index >= this.lanes.length) return 0;
        return this.lanes[index];
    }
}
