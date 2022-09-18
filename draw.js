const textEl = document.getElementById('syllable');
const mapWidth = 390, mapHeight = 844;

(async () => {
  CentrelineAnimator.blocksGeoJson = await d3.json("data/junction-and-margins-centreline.geojson");
  const eyeCoords = [ -79.466850201826219, 43.657227646269199 ]; // 100 High Park Av
  // const eyeCoords = [ -79.475580356435302, 43.666354317159403 ]; // Shul
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
    mercProjection.scale(3000000 + (100000 * rep));
    mercProjection.center(eyeCoords);
    const eyeCoordsProj = mercProjection(eyeCoords);
    ctx.translate(...eyeCoordsProj);
    ctx.rotate(rep * 37 * Math.PI / 180); 
    ctx.translate(-eyeCoordsProj[0], -eyeCoordsProj[1])
    const animator = new CentrelineAnimator(ctx, mercProjection);
    if (rep === 0) {
      ctx.beginPath();
      ctx.arc(eyeCoordsProj[0], eyeCoordsProj[1], rep < 20 ? rep+5 : 20, 0, Math.PI * 2);
      ctx.fill();
      animator.drawBlocksFromNode(13465772); // 100 High Park 
      // animator.drawBlocksFromNode(13464314); // Shul
      rep = 1;
      setTimeout(animateEmanation, 10000);
    } else {
      animator.drawAllBlocks(geoGenerator)
      rep += 1;
      const timeoutSpeed = 1000 - (rep * 75);  
      if (timeoutSpeed > 100) {
        setTimeout(animateEmanation, timeoutSpeed);
      } else if (rep <= 1000) {
        setTimeout(animateEmanation, 100);
      }
    }
  };
  animateEmanation();

})();