const mapWidth = 390, mapHeight = 844;
// (async () => {
//   const emanationsGeoJson = await d3.json("data/geojson-by-verse/4/emanations.geojson");
//   emanationFeature = emanationsGeoJson.features[0];
//   mercProjection.center(eyeCoords);
//   markEmanation(eyeCoords);
// })();

(async () => {
  CentrelineAnimator.blocksGeoJson = await d3.json("data/junction-and-margins-centreline.geojson");
  const eyeCoords = [ -79.466850201826219, 43.657227646269199 ];
  const mercProjection = d3.geoMercator();
  let rep = 0;

  animateEmanation = () => {
    const canvas = d3.select(".canvasWrapper").append("canvas")
      .attr("width", mapWidth)
      .attr("height", mapHeight);

    const ctx = canvas.node().getContext('2d');
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';

    const geoGenerator = d3.geoPath()
      .projection(mercProjection)
      .context(ctx);
    mercProjection.translate([mapWidth / 2, mapHeight / 2])
    mercProjection.scale(3000000);
    mercProjection.center(eyeCoords);
    const eyeCoordsProj = mercProjection(eyeCoords);
    ctx.translate(...eyeCoordsProj);
    ctx.rotate(rep * 18 * Math.PI / 180); 
    ctx.translate(-eyeCoordsProj[0], -eyeCoordsProj[1])
    const animator = new CentrelineAnimator(ctx, mercProjection);
    if (rep === 0) {
      ctx.beginPath();
      ctx.arc(eyeCoordsProj[0], eyeCoordsProj[1], rep < 20 ? rep+5 : 20, 0, Math.PI * 2);
      ctx.fill();
      animator.drawBlocksFromNode(13465772);
      rep = 1;
      setTimeout(animateEmanation, 10000);
    } else {
      animator.drawAllBlocks(geoGenerator)
      rep += 1;
      const timeoutSpeed = 1000 - (rep * 75);  
      if (timeoutSpeed > 100) {
        setTimeout(animateEmanation, timeoutSpeed);
      } else if (rep <= 20) {
        setTimeout(animateEmanation, 100);
      }
    }
  };
  animateEmanation();

})();

function markEmanation(projCoords, ctx) {
  ctx.beginPath();
  ctx.arc(projCoords[0], projCoords[1], 5, 0, Math.PI * 2);
  ctx.fill();
} 

// function drawBlocksFromNode(nodeId) {
//   console.log('draw blocks from node', nodeId);
//   const blocks = getBlocksAtNode(nodeId);
//   blocks.forEach(block => {
//     drawBlock(block, nodeId);
//   });
// }

// function drawBlock(blockFeature, startNodeId) {
//   const blockProps = blockFeature.properties;
  
//   if (blockDrawnIds.includes(blockProps.id)) return null;

//   const lineCoordinates = blockFeature.geometry.coordinates;
  
//   let endNodeId = blockProps.to_node_id;
//   const drawBackwards = startNodeId === blockProps.to_node_id;

//   if (drawBackwards) {
//     lineCoordinates.reverse();
//     endNodeId = blockProps.from_node_id;
//   }

//   const blockAnimeProps = {
//     id: blockProps.id,
//     coordinates: lineCoordinates,
//     endNodeId: endNodeId
//   }

//   animateBlockLine(blockAnimeProps)

//   blockDrawnIds.push(blockProps.id);
// }

// function animateBlockLine(blockAnimeProps, pointIndex = 0) {
//   const lineCoordinates = blockAnimeProps.coordinates;
//   const linesCount = lineCoordinates.length - 1;
//   const isLastLineInBlock = pointIndex === linesCount - 1;

//   const fromPoint = mercProjection(lineCoordinates[pointIndex]);
//   const toPoint = mercProjection(lineCoordinates[pointIndex + 1]);

//   const xDelta = toPoint[0] - fromPoint[0];
//   const yDelta = toPoint[1] - fromPoint[1];
  
//   const lineLength = Math.sqrt(xDelta ** 2 + yDelta ** 2);
//   const segmentLength = 1.2;
//   const segmentPercentOfLineLength = segmentLength / lineLength;

//   const xSegmentDelta = xDelta * segmentPercentOfLineLength;
//   const ySegmentDelta = yDelta * segmentPercentOfLineLength; 

//   const totalFrames = Math.ceil(lineLength / segmentLength);

//   let frameIndex = 0;

//   const drawSegment = () => {
//     const isFinalFrame = frameIndex === totalFrames - 1;

//     const segmentStartPoint = [
//       fromPoint[0] + (xSegmentDelta * frameIndex),
//       fromPoint[1] + (ySegmentDelta * frameIndex)
//     ];

//     let segmentEndPoint;
//     if (isFinalFrame) {
//       segmentEndPoint = toPoint;
//     } else {
//       segmentEndPoint = [
//         segmentStartPoint[0] + xSegmentDelta,
//         segmentStartPoint[1] + ySegmentDelta
//       ]
//     }

//     ctx.beginPath();
//     ctx.moveTo(...segmentStartPoint);
//     ctx.lineTo(...segmentEndPoint);
//     ctx.stroke();

//     if (isFinalFrame) {
//       if (isLastLineInBlock) {
//         drawBlocksFromNode(blockAnimeProps.endNodeId);
//       } else {
//         animateBlockLine(blockAnimeProps, pointIndex + 1);
//       }
//       return true;
//     } else {
//       frameIndex = frameIndex + 1;
//     }
    
//     requestAnimationFrame(drawSegment)
//   }

//   drawSegment();
// }

// function getBlocksAtNode(nodeId) {
//   const blocks = blocksGeoJson.features.filter(block => {
//     const blockProps = block.properties;
//     return blockProps.from_node_id === nodeId || blockProps.to_node_id === nodeId;
//   })
//   return blocks;
// }