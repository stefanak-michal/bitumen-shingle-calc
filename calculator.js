document.addEventListener('DOMContentLoaded', function() {
    // Canvas context
    let canvas = document.getElementById('roofCanvas');
    let ctx = canvas.getContext('2d');
    
    // Set initial canvas size
    canvas.width = 800;
    canvas.height = 600;
    
    // Calculate and visualize on button click
    document.getElementById('calculateBtn').addEventListener('click', function() {
        calculateAndVisualize();
    });
    
    // Also calculate on Enter key in any input
    document.querySelectorAll('input').forEach(function(input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                calculateAndVisualize();
            }
        });
    });
    
    // Initial calculation
    calculateAndVisualize();
    
    function calculateAndVisualize() {
        // Get configuration values
        const shingleWidth = parseFloat(document.getElementById('shingleWidth').value);
        const shingleHeight = parseFloat(document.getElementById('shingleHeight').value);
        const overlapHeight = parseFloat(document.getElementById('overlapHeight').value);
        const offsetWidth = parseFloat(document.getElementById('offsetWidth').value);
        const roofWidth = parseFloat(document.getElementById('roofWidth').value);
        const roofHeight = parseFloat(document.getElementById('roofHeight').value);
        
        // Validate inputs
        if (isNaN(shingleWidth) || isNaN(shingleHeight) || isNaN(overlapHeight) || 
            isNaN(offsetWidth) || isNaN(roofWidth) || isNaN(roofHeight)) {
            alert('Please enter valid numbers for all fields');
            return;
        }
        
        // Calculate effective shingle height (after overlap)
        const effectiveShingleHeight = shingleHeight - overlapHeight;
        
        if (effectiveShingleHeight <= 0) {
            alert('Overlap height must be less than shingle height');
            return;
        }
        
        // Calculate number of rows needed
        const numRows = Math.ceil(roofHeight / effectiveShingleHeight);
        
        // Calculate shingles per row (considering offset pattern)
        // For alternating rows, we need to account for offset
        let totalShingles = 0;
        const shinglesPerFullRow = Math.ceil(roofWidth / shingleWidth);
        
        for (let row = 0; row < numRows; row++) {
            if (row % 2 === 0) {
                // Even rows - full coverage
                totalShingles += shinglesPerFullRow;
            } else {
                // Odd rows - offset, might need one extra shingle
                const offsetShingles = Math.ceil((roofWidth + offsetWidth) / shingleWidth);
                totalShingles += offsetShingles;
            }
        }
        
        // Calculate roof area in square meters
        const roofAreaM2 = (roofWidth * roofHeight) / 1000000;
        
        // Update results
        document.getElementById('totalShingles').textContent = totalShingles;
        document.getElementById('rowsRequired').textContent = numRows;
        document.getElementById('shinglesPerRow').textContent = (totalShingles / numRows).toFixed(1);
        document.getElementById('roofArea').textContent = roofAreaM2.toFixed(2) + ' m²';
        
        // Draw visualization
        drawRoof(roofWidth, roofHeight, shingleWidth, shingleHeight, 
                 overlapHeight, offsetWidth, numRows);
    }
    
    function drawRoof(roofWidth, roofHeight, shingleWidth, shingleHeight, 
                      overlapHeight, offsetWidth, numRows) {
        // Visual constants
        const MAX_SCALE_FACTOR = 0.5; // Limit max scale to 50% for better visibility
        const SHINGLE_BORDER_WIDTH = 1; // Border line width for shingle outlines
        const TAB_LINE_WIDTH = 0.5; // Line width for tab divisions and overlap lines
        const BORDER_COLOR = '#000'; // Black color for all outlines
        
        // Calculate scale to fit canvas
        const padding = 40;
        const maxCanvasWidth = canvas.width - (padding * 2);
        const maxCanvasHeight = canvas.height - (padding * 2);
        
        const scaleX = maxCanvasWidth / roofWidth;
        const scaleY = maxCanvasHeight / roofHeight;
        const scale = Math.min(scaleX, scaleY, MAX_SCALE_FACTOR);
        
        // Scaled dimensions
        const scaledRoofWidth = roofWidth * scale;
        const scaledRoofHeight = roofHeight * scale;
        const scaledShingleWidth = shingleWidth * scale;
        const scaledShingleHeight = shingleHeight * scale;
        const scaledOverlapHeight = overlapHeight * scale;
        const scaledOffsetWidth = offsetWidth * scale;
        const effectiveShingleHeight = scaledShingleHeight - scaledOverlapHeight;
        
        // Center the drawing
        const offsetX = (canvas.width - scaledRoofWidth) / 2;
        const offsetY = (canvas.height - scaledRoofHeight) / 2;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw roof background
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(offsetX, offsetY, scaledRoofWidth, scaledRoofHeight);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(offsetX, offsetY, scaledRoofWidth, scaledRoofHeight);
        
        // Draw shingles row by row
        let currentY = offsetY;
        let rowIndex = 0;
        
        while (currentY < offsetY + scaledRoofHeight) {
            const isEvenRow = rowIndex % 2 === 0;
            let currentX = offsetX;
            
            // Apply offset for odd rows
            if (!isEvenRow) {
                currentX -= scaledOffsetWidth;
            }
            
            // Draw shingles in this row
            let shingleIndex = 0;
            while (currentX < offsetX + scaledRoofWidth) {
                // Main shingle body
                const shingleX = Math.max(currentX, offsetX);
                const shingleY = Math.max(currentY, offsetY);
                const shingleDrawWidth = Math.min(
                    scaledShingleWidth - (shingleX - currentX),
                    offsetX + scaledRoofWidth - shingleX
                );
                const shingleDrawHeight = Math.min(
                    scaledShingleHeight,
                    offsetY + scaledRoofHeight - shingleY
                );
                
                if (shingleDrawWidth > 0 && shingleDrawHeight > 0) {
                    // Draw shingle border (wireframe style - no fill)
                    ctx.strokeStyle = BORDER_COLOR;
                    ctx.lineWidth = SHINGLE_BORDER_WIDTH;
                    ctx.strokeRect(shingleX, shingleY, shingleDrawWidth, shingleDrawHeight);
                    
                    // Draw overlap line if not first row
                    if (rowIndex > 0 && shingleDrawHeight > scaledOverlapHeight) {
                        ctx.beginPath();
                        ctx.moveTo(shingleX, shingleY + scaledOverlapHeight);
                        ctx.lineTo(shingleX + shingleDrawWidth, shingleY + scaledOverlapHeight);
                        ctx.strokeStyle = BORDER_COLOR;
                        ctx.lineWidth = TAB_LINE_WIDTH;
                        ctx.stroke();
                    }
                    
                    // Draw tab lines (simulate 4-tab shingle)
                    const tabWidth = scaledShingleWidth / 4;
                    for (let t = 1; t < 4; t++) {
                        const tabX = currentX + (tabWidth * t);
                        if (tabX > offsetX && tabX < offsetX + scaledRoofWidth) {
                            ctx.beginPath();
                            ctx.moveTo(tabX, shingleY);
                            ctx.lineTo(tabX, Math.min(shingleY + shingleDrawHeight, 
                                                      offsetY + scaledRoofHeight));
                            ctx.strokeStyle = BORDER_COLOR;
                            ctx.lineWidth = TAB_LINE_WIDTH;
                            ctx.stroke();
                        }
                    }
                }
                
                currentX += scaledShingleWidth;
                shingleIndex++;
            }
            
            currentY += effectiveShingleHeight;
            rowIndex++;
        }
        
        // Draw scale indicator
        drawScaleIndicator(offsetX, offsetY, scaledRoofWidth, scaledRoofHeight, 
                          roofWidth, roofHeight, scale);
    }
    
    function drawScaleIndicator(x, y, width, height, realWidth, realHeight, scale) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(x + 10, y + height - 40, 150, 30);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 10, y + height - 40, 150, 30);
        
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Scale: ${(scale * 100).toFixed(2)}%`, x + 15, y + height - 22);
        ctx.fillText(`${(realWidth / 1000).toFixed(1)}m × ${(realHeight / 1000).toFixed(1)}m`, 
                    x + 15, y + height - 10);
    }
});
