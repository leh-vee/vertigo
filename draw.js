const mapWidth = 390, mapHeight = 844;
const canvas = d3.select(".canvasWrapper").append("canvas")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

const ctx = canvas.node().getContext('2d');
ctx.lineCap = 'round';
const mercProjection = d3.geoMercator();

let blocksGeoJson;
const blockDrawnIds = [];

function fitProjectionToFeatures(features) {
  mercProjection.center(SHUL_COORDS);
  mercProjection.translate([195, 222])
  mercProjection.scale(5000000);
  // mercProjection.fitSize([mapWidth, mapHeight], features); // scale 1267489.0147401579; translate [1758339.8734169512, 1075967.0886071238]
  // debugger;
}

const geoGenerator = d3.geoPath()
  .projection(mercProjection)
  .context(ctx);

const FURTHEST_EAST_COORD = [ -79.458508994609502, 43.651137126556698 ];
const ALMOST_ZEROS_COORD = [-79.4842815398717,43.669113317];
const SHUL_COORDS = [ -79.475580356435302, 43.666354317159403 ];

function markEmanation(feature) {
  const coordinates = mercProjection(feature.geometry.coordinates);

  ctx.beginPath();
  ctx.arc(coordinates[0], coordinates[1], 5, 0, Math.PI * 2);
  ctx.fill();
} 

function markCentre() {
  const coordinates = mercProjection(ALMOST_ZEROS_COORD);

  ctx.beginPath();
  ctx.arc(coordinates[0], coordinates[1], 5, 0, Math.PI * 2);
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

d3.json("data/junction-and-margins-centreline.geojson").then((centrelines) => {

  blocksGeoJson = centrelines;
  fitProjectionToFeatures(blocksGeoJson);
  
  d3.json("data/emanation-markers.geojson").then((markers) => {
    const emanationOne = markers.features[0];
    const blockNearestEmOne = getBlockById(emanationOne.properties.nearest_line_id);
    markEmanation(emanationOne);
    // markCentre();
    drawBlocksFromNode(blockNearestEmOne.properties.to_node_id);
  });
});

function getBlockById(id) {
  const block = blocksGeoJson.features.find(block => {
    return block.properties.id === id;
  });
  return block;
}

function getBlocksAtNode(nodeId) {
  const blocks = blocksGeoJson.features.filter(block => {
    const blockProps = block.properties;
    return blockProps.from_node_id === nodeId || blockProps.to_node_id === nodeId;
  })
  return blocks;
}