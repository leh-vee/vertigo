const mapWidth = 390, mapHeight = 844;
const canvas = d3.select(".canvasWrapper").append("canvas")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

const ctx = canvas.node().getContext('2d');
ctx.lineCap = 'round';

const mercProjection = d3.geoMercator();
const geoGenerator = d3.geoPath()
  .projection(mercProjection)
  .context(ctx);
mercProjection.translate([mapWidth / 2, mapHeight / 10])
mercProjection.scale(4000000);

let emanationFeature;
(async () => {
  const emanationsGeoJson = await d3.json("data/geojson-by-verse/4/emanations.geojson");
  emanationFeature = emanationsGeoJson.features[0];
  mercProjection.center(emanationFeature.geometry.coordinates);
  markEmanation(emanationFeature.geometry.coordinates);
})();

let blocksGeoJson;
const blockDrawnIds = [];
(async () => {
  blocksGeoJson = await d3.json("data/junction-and-margins-centreline.geojson");
  drawBlocksFromNode(emanationFeature.properties.nearestNodeId);
})();

function markEmanation(featureCoords) {
  const projCoords = mercProjection(featureCoords);

  ctx.beginPath();
  ctx.arc(projCoords[0], projCoords[1], 5, 0, Math.PI * 2);
  ctx.fill();
} 

function drawBlocksFromNode(nodeId) {
  console.log('draw blocks from node', nodeId);
  const blocks = getBlocksAtNode(nodeId);
  blocks.forEach(block => {
    drawBlock(block, nodeId);
  });
}

function drawBlock(blockFeature, startNodeId) {
  const blockProps = blockFeature.properties;
  
  if (blockDrawnIds.includes(blockProps.id)) return null;

  const lineCoordinates = blockFeature.geometry.coordinates;
  const lineCount = lineCoordinates.length - 1; 
  
  let endNodeId = blockProps.to_node_id;
  const drawBackwards = startNodeId === blockProps.to_node_id;

  if (drawBackwards) {
    lineCoordinates.reverse();
    endNodeId = blockProps.from_node_id;
  }

  const blockAnimeProps = {
    id: blockProps.id,
    coordinates: lineCoordinates,
    endNodeId: endNodeId
  }

  animateBlockLine(blockAnimeProps)

  blockDrawnIds.push(blockProps.id);
}

function animateBlockLine(blockAnimeProps, pointIndex = 0) {
  const lineCoordinates = blockAnimeProps.coordinates;
  const linesCount = lineCoordinates.length - 1;
  const isLastLineInBlock = pointIndex === linesCount - 1;

  const fromPoint = mercProjection(lineCoordinates[pointIndex]);
  const toPoint = mercProjection(lineCoordinates[pointIndex + 1]);

  const xDelta = toPoint[0] - fromPoint[0];
  const yDelta = toPoint[1] - fromPoint[1];
  
  const lineLength = Math.sqrt(xDelta ** 2 + yDelta ** 2);
  const segmentLength = 1.2;
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

    ctx.beginPath();
    ctx.moveTo(...segmentStartPoint);
    ctx.lineTo(...segmentEndPoint);
    ctx.stroke();

    if (isFinalFrame) {
      if (isLastLineInBlock) {
        drawBlocksFromNode(blockAnimeProps.endNodeId);
      } else {
        animateBlockLine(blockAnimeProps, pointIndex + 1);
      }
      return true;
    } else {
      frameIndex = frameIndex + 1;
    }
    
    requestAnimationFrame(drawSegment)
  }

  drawSegment();
}

function getBlocksAtNode(nodeId) {
  const blocks = blocksGeoJson.features.filter(block => {
    const blockProps = block.properties;
    return blockProps.from_node_id === nodeId || blockProps.to_node_id === nodeId;
  })
  return blocks;
}