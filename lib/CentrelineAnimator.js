class CentrelineAnimator {

  static blocksGeoJson = null;
  static getBlocksAtNode(nodeId) {
    const blocks = this.blocksGeoJson.features.filter(block => {
      const blockProps = block.properties;
      return blockProps.from_node_id === nodeId || blockProps.to_node_id === nodeId;
    })
    return blocks;
  }

  blockDrawnIds = [];

  constructor(canvas, projection) {
    if (CentrelineAnimator.blocksGeoJson === null) {
      throw('blocksGeoJson static member must be defined on class before instantiating objects');
    }
    this.ctx = canvas;
    this.projection = projection;
  }

  drawAllBlocks(geoGenerator) {
    this.ctx.beginPath();
    geoGenerator({type: 'FeatureCollection', features: CentrelineAnimator.blocksGeoJson.features})
    this.ctx.stroke();
  }

  drawBlocksFromNode(nodeId) {
    const blocks = CentrelineAnimator.getBlocksAtNode(nodeId);
    blocks.forEach(block => {
      this.drawBlock(block, nodeId);
    });
  }

  drawBlock(blockFeature, startNodeId) {
    const blockProps = blockFeature.properties;
    
    if (this.blockDrawnIds.includes(blockProps.id)) return null;
  
    let lineCoordinates = blockFeature.geometry.coordinates;
    const drawBackwards = startNodeId === blockProps.to_node_id;
    let endNodeId = blockProps.to_node_id;
  
    if (drawBackwards) {
      const lineCoordinatesCopy = [...lineCoordinates];
      lineCoordinates = [...lineCoordinatesCopy.reverse()];
      endNodeId = blockProps.from_node_id;
    }
  
    const blockAnimeProps = {
      id: blockProps.id,
      coordinates: lineCoordinates,
      endNodeId: endNodeId
    }
  
    this.animateBlockLine(blockAnimeProps)
  
    this.blockDrawnIds.push(blockProps.id);
  }

  animateBlockLine(blockAnimeProps, pointIndex = 0) {
    const lineCoordinates = blockAnimeProps.coordinates;
    const linesCount = lineCoordinates.length - 1;
    const isLastLineInBlock = pointIndex === linesCount - 1;
  
    const fromPoint = this.projection(lineCoordinates[pointIndex]);
    const toPoint = this.projection(lineCoordinates[pointIndex + 1]);
  
    const xDelta = toPoint[0] - fromPoint[0];
    const yDelta = toPoint[1] - fromPoint[1];
    
    const lineLength = Math.sqrt(xDelta ** 2 + yDelta ** 2);
    const segmentLength = 1;
    const segmentPercentOfLineLength = segmentLength / lineLength;
  
    const xSegmentDelta = xDelta * segmentPercentOfLineLength;
    const ySegmentDelta = yDelta * segmentPercentOfLineLength; 
  
    const totalFrames = Math.ceil(lineLength / segmentLength);
  
    let frameIndex = 0;
  
    const drawSegment = () => {
      const isFinalFrame = frameIndex === totalFrames - 1;
  
      const segmentStartPoint = [
        fromPoint[0] + (xSegmentDelta * frameIndex),
        fromPoint[1] + (ySegmentDelta * frameIndex)
      ];
  
      let segmentEndPoint;
      if (isFinalFrame) {
        segmentEndPoint = toPoint;
      } else {
        segmentEndPoint = [
          segmentStartPoint[0] + xSegmentDelta,
          segmentStartPoint[1] + ySegmentDelta
        ]
      }
  
      this.ctx.beginPath();
      this.ctx.moveTo(...segmentStartPoint);
      this.ctx.lineTo(...segmentEndPoint);
      this.ctx.stroke();
  
      if (isFinalFrame) {
        if (isLastLineInBlock) {
          this.drawBlocksFromNode(blockAnimeProps.endNodeId);
        } else {
          this.animateBlockLine(blockAnimeProps, pointIndex + 1);
        }
        return true;
      } else {
        frameIndex = frameIndex + 1;
      }
      
      requestAnimationFrame(drawSegment)
    }
  
    drawSegment();
  }
}
