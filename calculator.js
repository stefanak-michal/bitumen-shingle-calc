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
        const roofWidth = parseFloat(document.getElementById('roofWidth').value);
        const roofHeight = parseFloat(document.getElementById('roofHeight').value);
        
        // Calculate overlap height automatically as half of shingle height
        const overlapHeight = shingleHeight / 2;
        
        // Calculate horizontal offset automatically as 37% of shingle width
        const offsetWidth = shingleWidth * 0.37;
        
        // Validate inputs
        if (isNaN(shingleWidth) || isNaN(shingleHeight) || 
            isNaN(roofWidth) || isNaN(roofHeight)) {
            alert('Please enter valid numbers for all fields');
            return;
        }
        
        // Calculate effective shingle height (after overlap)
        const effectiveShingleHeight = shingleHeight - overlapHeight;
        
        if (effectiveShingleHeight <= 0) {
            alert('Overlap height must be less than shingle height');
            return;
        }
        
        // Calculate bottom row height (half shingle height)
        const bottomRowHeight = shingleHeight / 2;
        
        // Calculate number of rows needed
        // First row uses half height, then we need rows for remaining height
        const remainingHeight = roofHeight - bottomRowHeight;
        const additionalRows = Math.ceil(remainingHeight / effectiveShingleHeight);
        const numRows = 1 + additionalRows;
        
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
        const bottomRowHeight = scaledShingleHeight / 2;
        
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
        
        // Draw shingles from bottom to top
        let rowIndex = 0;
        let cumulativeExposedHeight = 0;
        
        while (rowIndex < numRows) {
            const isBottomRow = rowIndex === 0;
            const isEvenRow = rowIndex % 2 === 0;
            
            // Calculate row height and position
            let rowHeight, exposedHeight;
            if (isBottomRow) {
                // Bottom row: half shingle height (top half is used)
                rowHeight = bottomRowHeight;
                exposedHeight = bottomRowHeight;
            } else {
                // Regular rows: full shingle height
                rowHeight = scaledShingleHeight;
                exposedHeight = effectiveShingleHeight;
                
                // Check if this is the last row and adjust if needed
                const remainingSpace = scaledRoofHeight - cumulativeExposedHeight;
                if (remainingSpace < effectiveShingleHeight) {
                    // Last row - cut to fit
                    exposedHeight = remainingSpace;
                    rowHeight = Math.min(scaledShingleHeight, remainingSpace);
                }
            }
            
            // Y position (from bottom of roof, moving up)
            const currentY = offsetY + scaledRoofHeight - cumulativeExposedHeight - rowHeight;
            
            // Draw shingles in this row
            let currentX = offsetX;
            
            // Apply horizontal offset for odd rows
            if (!isEvenRow) {
                currentX -= scaledOffsetWidth;
            }
            
            let shingleIndex = 0;
            while (currentX < offsetX + scaledRoofWidth) {
                // Calculate visible portion of shingle (only the exposed part)
                const shingleX = Math.max(currentX, offsetX);
                const visibleY = offsetY + scaledRoofHeight - cumulativeExposedHeight;
                const shingleDrawWidth = Math.min(
                    scaledShingleWidth - (shingleX - currentX),
                    offsetX + scaledRoofWidth - shingleX
                );
                const shingleDrawHeight = Math.min(
                    exposedHeight,
                    offsetY + scaledRoofHeight - visibleY
                );
                
                if (shingleDrawWidth > 0 && shingleDrawHeight > 0) {
                    ctx.strokeStyle = BORDER_COLOR;
                    ctx.lineWidth = SHINGLE_BORDER_WIDTH;
                    
                    // Draw shingles with tab shapes - but NOT on bottom starter row
                    if (!isBottomRow) {
                        const tabWidth = scaledShingleWidth / 4;
                        // Tab depth is approximately 1/3 of shingle height (based on reference image)
                        const tabDepth = scaledShingleHeight / 3;
                        
                        // Only draw tabs if they're visible (not covered by overlap)
                        if (shingleDrawHeight > tabDepth) {
                            // Draw the shingle outline with tab cutouts
                            ctx.beginPath();
                            
                            // Start from top-left corner
                            ctx.moveTo(shingleX, visibleY);
                            
                            // Top edge to top-right
                            ctx.lineTo(shingleX + shingleDrawWidth, visibleY);
                            
                            // Right edge down to where tabs start
                            const tabStartY = visibleY + (shingleDrawHeight - tabDepth);
                            ctx.lineTo(shingleX + shingleDrawWidth, tabStartY);
                            
                            // Draw the tab cutouts from right to left
                            for (let t = 3; t >= 0; t--) {
                                const tabLeftX = currentX + (tabWidth * t);
                                const tabRightX = currentX + (tabWidth * (t + 1));
                                
                                // Only draw this tab if it's within the visible area
                                if (tabRightX > shingleX && tabLeftX < shingleX + shingleDrawWidth) {
                                    const clippedTabRight = Math.min(tabRightX, shingleX + shingleDrawWidth);
                                    const clippedTabLeft = Math.max(tabLeftX, shingleX);
                                    
                                    // Horizontal line at top of tab
                                    if (clippedTabRight > shingleX) {
                                        ctx.lineTo(clippedTabRight, tabStartY);
                                    }
                                    
                                    // Vertical line down (right side of tab slot)
                                    if (tabRightX > shingleX && tabRightX <= shingleX + shingleDrawWidth) {
                                        ctx.lineTo(tabRightX, visibleY + shingleDrawHeight);
                                    } else if (clippedTabRight > shingleX) {
                                        ctx.lineTo(clippedTabRight, visibleY + shingleDrawHeight);
                                    }
                                    
                                    // Horizontal line at bottom (bottom of tab)
                                    if (clippedTabLeft >= shingleX) {
                                        ctx.lineTo(clippedTabLeft, visibleY + shingleDrawHeight);
                                    }
                                    
                                    // Vertical line up (left side of tab slot)
                                    if (tabLeftX >= shingleX && tabLeftX < shingleX + shingleDrawWidth) {
                                        ctx.lineTo(tabLeftX, tabStartY);
                                    } else if (clippedTabLeft < shingleX + shingleDrawWidth) {
                                        ctx.lineTo(clippedTabLeft, tabStartY);
                                    }
                                }
                            }
                            
                            // Left edge back to start
                            ctx.lineTo(shingleX, tabStartY);
                            ctx.lineTo(shingleX, visibleY);
                            
                            ctx.stroke();
                        } else {
                            // If tabs aren't visible, just draw a rectangle
                            ctx.strokeRect(shingleX, visibleY, shingleDrawWidth, shingleDrawHeight);
                        }
                    } else {
                        // Bottom row: simple rectangle (no tabs)
                        ctx.strokeRect(shingleX, visibleY, shingleDrawWidth, shingleDrawHeight);
                    }
                }
                
                currentX += scaledShingleWidth;
                shingleIndex++;
            }
            
            cumulativeExposedHeight += exposedHeight;
            rowIndex++;
            
            // Safety check to prevent infinite loop
            if (cumulativeExposedHeight >= scaledRoofHeight) {
                break;
            }
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
